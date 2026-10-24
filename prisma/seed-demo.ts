/**
 * Seeds (or resets) the public demo workspace.
 *
 *   npm run seed:demo
 *
 * Needs DATABASE_URL and DEMO_PASSWORD, plus GOOGLE_GENERATIVE_AI_API_KEY the
 * first time (to embed the demo docs). Safe to re-run: it only touches the
 * demo workspace and the @supportai.demo users, and reuses existing embeddings.
 * The daily cron (/api/cron/demo-reset) runs the same reset.
 */
import "dotenv/config";
import { prisma } from "../lib/prisma";
import { resetDemoWorkspace } from "../lib/demo/reset";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set.");
  const host = new URL(process.env.DATABASE_URL).host;
  console.log(`\nSeeding demo workspace on ${host}\n`);

  const report = await resetDemoWorkspace((line) => console.log(line));
  console.log("\nDone:", report, "\n");
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("\nDemo seed failed:", error instanceof Error ? error.message : error, "\n");
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});
