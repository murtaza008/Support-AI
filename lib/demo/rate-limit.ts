import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { DEMO_CHAT_GLOBAL_LIMIT_PER_HOUR, DEMO_CHAT_LIMIT_PER_HOUR } from "./constants";

/**
 * Stable anonymous id for a demo visitor: a salted hash of their IP. It is stored
 * as the conversation's visitorId, so the hourly limit is just a message count.
 */
export function demoVisitorKey(request: Request): string {
  const ip =
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const salt = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";
  return "demo-" + createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 16);
}

/** Returns a friendly message if this demo visitor (or the demo as a whole) is over its hourly chat budget. */
export async function demoChatLimitMessage(
  workspaceId: string,
  visitorKey: string,
): Promise<string | null> {
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const [mine, everyone] = await Promise.all([
    prisma.message.count({
      where: { workspaceId, role: "USER", createdAt: { gte: since }, conversation: { visitorId: visitorKey } },
    }),
    prisma.message.count({ where: { workspaceId, role: "USER", createdAt: { gte: since } } }),
  ]);
  if (mine >= DEMO_CHAT_LIMIT_PER_HOUR) {
    return `You've reached the demo limit of ${DEMO_CHAT_LIMIT_PER_HOUR} messages per hour. Please try again later, or sign up free to test without limits.`;
  }
  if (everyone >= DEMO_CHAT_GLOBAL_LIMIT_PER_HOUR) {
    return "The demo is very busy right now. Please try again in a little while, or sign up free to test with your own workspace.";
  }
  return null;
}
