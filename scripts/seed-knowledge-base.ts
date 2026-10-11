/**
 * Seeds a demo assistant + knowledge base into an existing user's workspace.
 *
 *   npx tsx scripts/seed-knowledge-base.ts --dry   # show what it would do, write nothing
 *   npx tsx scripts/seed-knowledge-base.ts         # actually insert
 *   npx tsx scripts/seed-knowledge-base.ts you@mail.com
 *
 * This calls the app's own ingestDocument(), so every document is chunked and
 * embedded through the real pipeline — real Gemini embedding calls, real
 * pgvector rows. Nothing here is faked, otherwise RAG retrieval could not find
 * these documents at all.
 *
 * It also seeds demo conversations. Each question goes through the same steps
 * as the chat route (retrieve → RAG system prompt → Gemini), so the saved
 * answers and citations are real model output. No AI call is then needed on
 * camera: the demo just opens them under Conversations.
 *
 * Safe to re-run: the assistant and each document are matched by name, each
 * conversation by its question, and skipped if they already exist. If Gemini's
 * quota runs out part-way, whatever was saved stays — re-run later to finish.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { generateText } from "ai";
import { prisma } from "../lib/prisma";
import { chatModel } from "../lib/gemini";
import { ingestDocument, retrieveContext, buildRagSystemPrompt, toCitations } from "../lib/rag";

const DRY_RUN = process.argv.includes("--dry");
const EMAIL = (
  process.argv.slice(2).find((a) => !a.startsWith("--")) ??
  process.env.SEED_USER_EMAIL ??
  "murtazaaa7798@gmail.com"
).toLowerCase();

const DOCS_DIR = join(import.meta.dirname, "demo-docs");

const ASSISTANT = {
  name: "Nimbus Support Bot",
  tone: "professional",
  description: "Answers customer questions about orders, shipping, warranty and billing.",
  systemPrompt:
    "You are the support assistant for Nimbus Robotics, a warehouse robotics company. " +
    "Answer only from the provided documents. If the documents do not cover the question, " +
    "say so plainly and suggest emailing support@nimbusrobotics.com.",
};

const DOCUMENTS = [
  { name: "Refund Policy", file: "01-refund-policy.txt" },
  { name: "Shipping and Delivery", file: "02-shipping-and-delivery.txt" },
  { name: "Warranty and Repairs", file: "03-warranty-and-repairs.txt" },
  { name: "Subscription and Billing", file: "04-subscription-and-billing.txt" },
];

/**
 * Ordered by importance, not by date: the first entry is the one opened on
 * camera, so it is generated first in case the quota runs out. `hoursAgo`
 * backdates the rest across two weeks so the analytics chart has a shape.
 */
const CONVERSATIONS: {
  question: string;
  channel: "PLAYGROUND" | "WIDGET";
  hoursAgo: number;
  resolved: boolean;
  rating?: number;
}[] = [
  {
    question: "If I cancel my annual plan after 10 days, do I get a refund?",
    channel: "PLAYGROUND",
    hoursAgo: 0,
    resolved: true,
    rating: 5,
  },
  {
    question: "How long does standard shipping take, and is it free?",
    channel: "WIDGET",
    hoursAgo: 5,
    resolved: true,
    rating: 5,
  },
  {
    question: "Does the warranty cover water damage?",
    channel: "WIDGET",
    hoursAgo: 27,
    resolved: true,
    rating: 4,
  },
  {
    question: "I used a 60% off promo code on my order. Can I get my money back?",
    channel: "WIDGET",
    hoursAgo: 52,
    resolved: true,
  },
  {
    question: "Do you offer on-site installation for the robots?",
    channel: "WIDGET",
    hoursAgo: 98,
    resolved: false,
  },
  {
    question: "Where can I find my invoices?",
    channel: "WIDGET",
    hoursAgo: 149,
    resolved: true,
    rating: 5,
  },
  {
    question: "Do you ship internationally, and who pays the customs fees?",
    channel: "WIDGET",
    hoursAgo: 218,
    resolved: true,
    rating: 4,
  },
  {
    question: "What does a repair cost once the warranty has expired?",
    channel: "PLAYGROUND",
    hoursAgo: 296,
    resolved: true,
  },
];

/** Gap between chat calls, to stay under the free tier's per-minute limit. */
const CHAT_CALL_GAP_MS = 7000;

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set — check your .env file.");
  }
  if (!DRY_RUN && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error(
      "GOOGLE_GENERATIVE_AI_API_KEY is not set — embeddings cannot be generated without it.",
    );
  }

  const user = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (!user) {
    console.error(`\n✗ No user found with email "${EMAIL}" in this database.`);
    console.error(
      "  The DATABASE_URL in .env may point to a different database than your\n" +
        "  deployed app uses. Re-run with that connection string, e.g.\n" +
        '  DATABASE_URL="postgresql://…" npx tsx scripts/seed-knowledge-base.ts\n',
    );
    process.exitCode = 1;
    return;
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: user.id },
    include: { workspace: true },
    orderBy: { createdAt: "asc" },
  });
  if (!membership) {
    console.error(
      `\n✗ ${EMAIL} exists but has no workspace yet.\n` +
        "  Log into the app and finish onboarding first, then re-run this script.\n",
    );
    process.exitCode = 1;
    return;
  }

  const workspace = membership.workspace;
  console.log(`\nUser:      ${user.email} (${user.displayName ?? "no name"})`);
  console.log(`Workspace: ${workspace.name} [${workspace.id}]`);
  console.log(`Mode:      ${DRY_RUN ? "DRY RUN — nothing will be written" : "WRITE"}\n`);

  // ── Assistant ─────────────────────────────────────────────────────────
  let assistant = await prisma.assistant.findFirst({
    where: { workspaceId: workspace.id, name: ASSISTANT.name },
  });

  if (assistant) {
    console.log(`  = assistant "${ASSISTANT.name}" — already there`);
  } else if (DRY_RUN) {
    console.log(`  + assistant "${ASSISTANT.name}" (tone: ${ASSISTANT.tone})`);
  } else {
    assistant = await prisma.assistant.create({
      data: {
        workspaceId: workspace.id,
        createdById: user.id,
        name: ASSISTANT.name,
        tone: ASSISTANT.tone,
        description: ASSISTANT.description,
        systemPrompt: ASSISTANT.systemPrompt,
      },
    });
    console.log(`  + assistant "${ASSISTANT.name}" (tone: ${ASSISTANT.tone})`);
  }

  // ── Documents ─────────────────────────────────────────────────────────
  console.log("");
  let created = 0;
  let skipped = 0;

  for (const doc of DOCUMENTS) {
    const existing = await prisma.document.findFirst({
      where: { workspaceId: workspace.id, name: doc.name },
      select: { id: true, status: true },
    });

    if (existing) {
      console.log(`  – ${doc.name.padEnd(24)} already exists (${existing.status}), skipped`);
      skipped++;
      continue;
    }

    const content = readFileSync(join(DOCS_DIR, doc.file), "utf8");

    if (DRY_RUN) {
      console.log(`  + ${doc.name.padEnd(24)} ${content.length} chars — would embed`);
      created++;
      continue;
    }

    process.stdout.write(`  … ${doc.name.padEnd(24)} embedding…`);
    const result = await ingestDocument({
      workspaceId: workspace.id,
      assistantId: assistant!.id,
      name: doc.name,
      sourceType: "TEXT",
      content,
      createdById: user.id,
    });
    console.log(`\r  + ${doc.name.padEnd(24)} ${content.length} chars → ${result.chunks} chunk(s), READY`);
    created++;
  }

  console.log(
    `\n${DRY_RUN ? "Would add" : "Added"} ${created} document${created === 1 ? "" : "s"}` +
      (skipped ? `, skipped ${skipped} that already existed.` : ".") +
      "\n",
  );

  // ── Conversations ─────────────────────────────────────────────────────
  let convCreated = 0;
  let convSkipped = 0;
  let convFailed = false;

  for (const conv of CONVERSATIONS) {
    const label = `"${conv.question.slice(0, 52)}${conv.question.length > 52 ? "…" : ""}"`;

    const existing = await prisma.message.findFirst({
      where: { workspaceId: workspace.id, role: "USER", content: conv.question },
      select: { id: true },
    });
    if (existing) {
      console.log(`  – ${label} already exists, skipped`);
      convSkipped++;
      continue;
    }

    if (DRY_RUN) {
      console.log(`  + ${label} ${conv.channel.toLowerCase()} — would ask Gemini`);
      convCreated++;
      continue;
    }

    if (convCreated > 0) await new Promise((r) => setTimeout(r, CHAT_CALL_GAP_MS));

    // Same steps as app/api/chat/route.ts, minus the streaming.
    let text: string;
    let citations: ReturnType<typeof toCitations>;
    try {
      const hits = await retrieveContext({
        workspaceId: workspace.id,
        assistantId: assistant!.id,
        query: conv.question,
      });
      citations = toCitations(hits);
      const result = await generateText({
        model: chatModel(),
        system: buildRagSystemPrompt(assistant!, hits),
        prompt: conv.question,
      });
      text = result.text;
    } catch (e) {
      console.log(`  ✗ ${label} failed: ${e instanceof Error ? e.message : e}`);
      convFailed = true;
      break;
    }

    const askedAt = new Date(Date.now() - conv.hoursAgo * 60 * 60 * 1000);
    await prisma.conversation.create({
      data: {
        workspaceId: workspace.id,
        assistantId: assistant!.id,
        channel: conv.channel,
        visitorId: conv.channel === "WIDGET" ? randomUUID() : null,
        resolved: conv.resolved,
        rating: conv.rating ?? null,
        createdAt: askedAt,
        messages: {
          create: [
            { workspaceId: workspace.id, role: "USER", content: conv.question, createdAt: askedAt },
            {
              workspaceId: workspace.id,
              role: "ASSISTANT",
              content: text,
              citations: citations.length > 0 ? citations : undefined,
              createdAt: new Date(askedAt.getTime() + 4000),
            },
          ],
        },
      },
    });
    console.log(`  + ${label} ${conv.channel.toLowerCase()}, ${citations.length} citation(s)`);
    convCreated++;
  }

  console.log(
    `\n${DRY_RUN ? "Would add" : "Added"} ${convCreated} conversation${convCreated === 1 ? "" : "s"}` +
      (convSkipped ? `, skipped ${convSkipped} that already existed.` : ".") +
      "\n",
  );
  if (convFailed) {
    console.log(
      "Stopped early — most likely Gemini's free-tier quota. What was saved is kept;\n" +
        "re-run this script later and it will pick up where it left off.\n",
    );
    process.exitCode = 1;
  }

  if (!DRY_RUN && assistant) {
    console.log(`Assistant ID (for the widget embed script):\n  ${assistant.id}\n`);
  }

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("\nSeed failed:", error instanceof Error ? error.message : error, "\n");
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});
