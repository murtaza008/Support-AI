import { randomBytes, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { chunkText } from "@/lib/chunker";
import { embedTexts } from "@/lib/gemini";
import { ingestDocument, type Citation } from "@/lib/rag";
import { DEMO_EMAIL, DEMO_WORKSPACE_ID, DEMO_WORKSPACE_SLUG } from "./constants";
import { DEMO_ASSISTANTS, DEMO_TEAM, DEMO_WORKSPACE } from "./content";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export type DemoResetReport = {
  workspaceId: string;
  documentsReused: number;
  documentsEmbedded: number;
  assistantsRemoved: number;
  conversations: number;
  messages: number;
  citationsReused: number;
  questionsEmbedded: number;
};

/**
 * Restores the demo workspace to its seeded state. Every write is scoped to the
 * demo workspace or to the @supportai.demo users, so no other account is touched.
 *
 * Embeddings are reused: a document is only (re-)embedded when its stored chunks
 * no longer match the seed text, and citation similarities are carried over from
 * the previous run. A normal daily reset makes no Gemini calls at all.
 */
export async function resetDemoWorkspace(
  log: (line: string) => void = () => {},
): Promise<DemoResetReport> {
  const password = process.env.DEMO_PASSWORD;
  if (!password || password.length < 16) {
    throw new Error("DEMO_PASSWORD must be set to a random value of at least 16 characters.");
  }
  const now = Date.now();

  // ── Users ──────────────────────────────────────────────────────────────
  const userIds = new Map<string, string>();
  for (const member of DEMO_TEAM) {
    const isOwner = member.email === DEMO_EMAIL;
    const existing = await prisma.user.findUnique({ where: { email: member.email } });
    // Teammates can never sign in; the owner signs in with DEMO_PASSWORD.
    const needsHash =
      !existing || !isOwner || !(await bcrypt.compare(password, existing.passwordHash));
    const passwordHash = needsHash
      ? await bcrypt.hash(isOwner ? password : randomBytes(32).toString("base64url"), 12)
      : undefined;

    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: { displayName: member.displayName, avatarUrl: null, passwordHash },
        })
      : await prisma.user.create({
          data: { email: member.email, displayName: member.displayName, passwordHash: passwordHash! },
        });
    userIds.set(member.email, user.id);
  }
  const ownerId = userIds.get(DEMO_EMAIL)!;
  const demoUserIds = [...userIds.values()];

  // ── Workspace ──────────────────────────────────────────────────────────
  const found = await prisma.workspace.findUnique({ where: { slug: DEMO_WORKSPACE_SLUG } });
  if (found && found.createdById !== ownerId) {
    throw new Error(
      `Workspace "${DEMO_WORKSPACE_SLUG}" exists but was not created by ${DEMO_EMAIL}; refusing to touch it.`,
    );
  }
  const workspaceData = {
    name: DEMO_WORKSPACE.name,
    brandColor: DEMO_WORKSPACE.brandColor,
    plan: "AGENCY" as const,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
  };
  const workspace = found
    ? await prisma.workspace.update({ where: { id: found.id }, data: workspaceData })
    : await prisma.workspace.create({
        data: {
          id: DEMO_WORKSPACE_ID,
          slug: DEMO_WORKSPACE_SLUG,
          createdById: ownerId,
          createdAt: new Date(now - 48 * DAY),
          ...workspaceData,
        },
      });
  const workspaceId = workspace.id;
  log(`Workspace ${workspace.name} [${workspaceId}]`);

  // ── Team ───────────────────────────────────────────────────────────────
  // Strangers out of the demo workspace, demo users out of anyone else's.
  await prisma.workspaceMember.deleteMany({
    where: {
      OR: [
        { workspaceId, userId: { notIn: demoUserIds } },
        { workspaceId: { not: workspaceId }, userId: { in: demoUserIds } },
      ],
    },
  });
  for (const member of DEMO_TEAM) {
    const userId = userIds.get(member.email)!;
    const joined = { role: member.role, createdAt: new Date(now - member.joinedDaysAgo * DAY) };
    await prisma.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId, userId } },
      create: { workspaceId, userId, ...joined },
      update: joined,
    });
  }
  await prisma.workspaceInvite.deleteMany({ where: { workspaceId } });
  log(`Team: ${DEMO_TEAM.map((m) => `${m.displayName} (${m.role})`).join(", ")}`);

  // ── Assistants ─────────────────────────────────────────────────────────
  const seededAssistantIds = DEMO_ASSISTANTS.map((a) => a.id);
  const clash = await prisma.assistant.findFirst({
    where: { id: { in: seededAssistantIds }, workspaceId: { not: workspaceId } },
  });
  if (clash) throw new Error(`Assistant ${clash.id} belongs to another workspace; refusing to touch it.`);

  const { count: assistantsRemoved } = await prisma.assistant.deleteMany({
    where: { workspaceId, id: { notIn: seededAssistantIds } },
  });
  for (const a of DEMO_ASSISTANTS) {
    const settings = {
      name: a.name,
      description: a.description,
      tone: a.tone,
      systemPrompt: a.systemPrompt,
      brandColor: a.brandColor,
    };
    await prisma.assistant.upsert({
      where: { id: a.id },
      create: {
        id: a.id,
        workspaceId,
        createdById: ownerId,
        createdAt: new Date(now - a.createdDaysAgo * DAY),
        ...settings,
      },
      update: settings,
    });
  }
  log(`Assistants: ${DEMO_ASSISTANTS.map((a) => a.name).join(", ")}`);

  // ── Documents (reuse embeddings when the chunks still match) ───────────
  const existingDocs = await prisma.document.findMany({
    where: { workspaceId },
    include: {
      chunks: { select: { content: true }, orderBy: { chunkIndex: "asc" } },
    },
  });
  const embeddedRows = await prisma.$queryRaw<{ documentId: string; embedded: number }[]>`
    SELECT "documentId", COUNT(embedding)::int AS embedded
    FROM "DocumentChunk"
    WHERE "workspaceId" = ${workspaceId}
    GROUP BY "documentId"
  `;
  const embeddedByDoc = new Map(embeddedRows.map((r) => [r.documentId, r.embedded]));

  const keep = new Set<string>();
  const docByKey = new Map<string, { id: string; name: string }>();
  let documentsReused = 0;
  let documentsEmbedded = 0;

  for (const a of DEMO_ASSISTANTS) {
    for (const [index, doc] of a.docs.entries()) {
      const expected = chunkText(doc.content);
      const match = existingDocs.find(
        (d) =>
          !keep.has(d.id) &&
          d.assistantId === a.id &&
          d.name === doc.name &&
          d.status === "READY" &&
          d.chunks.length === expected.length &&
          d.chunks.every((c, i) => c.content === expected[i]) &&
          embeddedByDoc.get(d.id) === expected.length,
      );

      let id: string;
      if (match) {
        id = match.id;
        documentsReused++;
      } else {
        log(`  embedding "${doc.name}"…`);
        ({ id } = await ingestDocument({
          workspaceId,
          assistantId: a.id,
          name: doc.name,
          sourceType: "TEXT",
          content: doc.content,
          createdById: ownerId,
        }));
        await prisma.document.update({
          where: { id },
          data: { createdAt: new Date(now - (a.createdDaysAgo - 1) * DAY + index * HOUR) },
        });
        documentsEmbedded++;
      }
      keep.add(id);
      docByKey.set(`${a.id}:${doc.key}`, { id, name: doc.name });
    }
  }
  await prisma.document.deleteMany({ where: { workspaceId, id: { notIn: [...keep] } } });
  log(`Documents: ${documentsReused} reused, ${documentsEmbedded} embedded`);

  // ── Citations (carry over similarities from the last run) ──────────────
  const previousAnswers = await prisma.message.findMany({
    where: { workspaceId, role: "ASSISTANT" },
    select: { content: true, citations: true },
  });
  const cached = new Map<string, Citation[]>();
  for (const m of previousAnswers) {
    if (Array.isArray(m.citations)) cached.set(m.content, m.citations as unknown as Citation[]);
  }

  type TurnCitations = { question: string; docs: { id: string; name: string }[]; citations?: Citation[] };
  const turnCitations = new Map<string, TurnCitations>();
  let citationsReused = 0;

  for (const a of DEMO_ASSISTANTS) {
    for (const conv of a.conversations) {
      for (const turn of conv.turns) {
        const docs = turn.cites.map((key) => {
          const doc = docByKey.get(`${a.id}:${key}`);
          if (!doc) throw new Error(`${a.name}: answer cites unknown doc "${key}".`);
          return doc;
        });
        const prev = cached.get(turn.a);
        const reusable =
          docs.length === 0 ||
          (prev?.length === docs.length && prev.every((c, i) => c.documentId === docs[i].id));
        if (reusable) citationsReused += docs.length > 0 ? 1 : 0;
        turnCitations.set(`${a.id}:${turn.a}`, {
          question: turn.q,
          docs,
          citations: reusable ? (docs.length === 0 ? [] : prev) : undefined,
        });
      }
    }
  }

  const missing = [...turnCitations.values()].filter((t) => !t.citations);
  if (missing.length > 0) {
    log(`  embedding ${missing.length} questions for citation scores…`);
    const vectors = await embedTexts(missing.map((t) => t.question));
    for (const [i, t] of missing.entries()) {
      const vectorLiteral = `[${vectors[i].join(",")}]`;
      const rows = await prisma.$queryRaw<{ documentId: string; similarity: number }[]>`
        SELECT "documentId", MAX(1 - (embedding <=> ${vectorLiteral}::vector))::float8 AS similarity
        FROM "DocumentChunk"
        WHERE "documentId" IN (${Prisma.join(t.docs.map((d) => d.id))}) AND embedding IS NOT NULL
        GROUP BY "documentId"
      `;
      const similarity = new Map(rows.map((r) => [r.documentId, r.similarity]));
      t.citations = t.docs.map((d) => ({
        documentId: d.id,
        documentName: d.name,
        similarity: similarity.get(d.id) ?? 0,
      }));
    }
  }

  // ── Conversations (dated relative to now, so the 30-day charts stay full) ──
  const conversations: Prisma.ConversationCreateManyInput[] = [];
  const messages: Prisma.MessageCreateManyInput[] = [];

  for (const a of DEMO_ASSISTANTS) {
    for (const conv of a.conversations) {
      const id = randomUUID();
      const start = now - conv.daysAgo * DAY - Math.max(conv.hoursAgo, 2) * HOUR;
      let t = start;
      for (const turn of conv.turns) {
        messages.push({ conversationId: id, workspaceId, role: "USER", content: turn.q, createdAt: new Date(t) });
        t += 5_000 + turn.a.length * 15;
        const citations = turnCitations.get(`${a.id}:${turn.a}`)!.citations!;
        messages.push({
          conversationId: id,
          workspaceId,
          role: "ASSISTANT",
          content: turn.a,
          citations: citations.length > 0 ? (citations as unknown as Prisma.InputJsonValue) : undefined,
          createdAt: new Date(t),
        });
        t += 75_000;
      }
      conversations.push({
        id,
        workspaceId,
        assistantId: a.id,
        channel: conv.channel,
        visitorId: conv.channel === "WIDGET" ? randomUUID() : null,
        resolved: conv.resolved,
        rating: conv.rating ?? null,
        createdAt: new Date(start),
        updatedAt: new Date(t),
      });
    }
  }

  await prisma.$transaction([
    prisma.conversation.deleteMany({ where: { workspaceId } }),
    prisma.conversation.createMany({ data: conversations }),
    prisma.message.createMany({ data: messages }),
  ]);
  log(`Conversations: ${conversations.length} (${messages.length} messages)`);

  return {
    workspaceId,
    documentsReused,
    documentsEmbedded,
    assistantsRemoved,
    conversations: conversations.length,
    messages: messages.length,
    citationsReused,
    questionsEmbedded: missing.length,
  };
}
