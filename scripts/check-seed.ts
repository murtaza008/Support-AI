/**
 * Read-only check of the seeded knowledge base, plus a live retrieval test.
 *
 *   npx tsx scripts/check-seed.ts
 *   npx tsx scripts/check-seed.ts "your own question here"
 *
 * The retrieval test runs a real embedding call and a real pgvector query —
 * it proves the seeded documents are actually findable, not just stored.
 */
import "dotenv/config";
import { prisma } from "../lib/prisma";
import { retrieveContext } from "../lib/rag";

const EMAIL = process.env.SEED_USER_EMAIL ?? "murtazaaa7798@gmail.com";
const QUESTION =
  process.argv.slice(2).find((a) => !a.startsWith("--")) ??
  "How many days do I have to request a refund, and who do I email?";

async function main() {
  const member = await prisma.workspaceMember.findFirst({
    where: { user: { email: EMAIL.toLowerCase() } },
    include: { workspace: true },
    orderBy: { createdAt: "asc" },
  });
  if (!member) throw new Error(`No workspace for ${EMAIL}`);
  const workspace = member.workspace;

  const assistants = await prisma.assistant.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "asc" },
  });

  console.log(`\nWorkspace: ${workspace.name}\n`);
  for (const a of assistants) {
    console.log(`Assistant: ${a.name}  (tone: ${a.tone})`);
    console.log(`   id: ${a.id}`);
  }

  const docs = await prisma.document.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { chunks: true } } },
  });

  console.log("\nDocuments:");
  for (const d of docs) {
    const embedded = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM "DocumentChunk"
      WHERE "documentId" = ${d.id} AND embedding IS NOT NULL
    `;
    console.log(
      `  ${d.name.padEnd(24)} ${d.status.padEnd(8)} ${d.charCount} chars · ` +
        `${d._count.chunks} chunk(s) · ${Number(embedded[0].count)} embedded`,
    );
  }

  const assistant = assistants[0];
  if (!assistant) {
    console.log("\nNo assistant to test retrieval against.\n");
    await prisma.$disconnect();
    return;
  }

  console.log(`\n── Live retrieval test ──\nQ: ${QUESTION}\n`);
  const hits = await retrieveContext({
    workspaceId: workspace.id,
    assistantId: assistant.id,
    query: QUESTION,
    limit: 3,
  });

  if (hits.length === 0) {
    console.log("No chunks retrieved — something is wrong with the embeddings.\n");
  } else {
    for (const h of hits) {
      console.log(`  ${h.similarity.toFixed(4)}  ${h.documentName}`);
      console.log(`          ${h.content.replace(/\s+/g, " ").slice(0, 110)}…`);
    }
    console.log("");
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});
