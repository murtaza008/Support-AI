import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { requireWorkspaceMember } from "@/lib/workspace";
import { handleApiError } from "@/lib/handle-error";
import { ANALYTICS_RANGES, findGaps, topDocuments, uncitedAnswers } from "@/lib/analytics";

const Query = z.object({
  workspaceId: z.string(),
  days: z.coerce
    .number()
    .int()
    .refine((d) => (ANALYTICS_RANGES as readonly number[]).includes(d), "days must be 7, 30 or 90")
    .default(30),
});

const DAY = 24 * 60 * 60 * 1000;

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const { workspaceId, days } = Query.parse({
      workspaceId: searchParams.get("workspaceId"),
      days: searchParams.get("days") ?? undefined,
    });
    await requireWorkspaceMember(userId, workspaceId);

    const now = Date.now();
    const since = new Date(now - days * DAY);
    const prevSince = new Date(now - 2 * days * DAY);

    // One read of the period's messages serves both the volume numbers and the
    // citation stats (citations are only set on answers).
    const [rows, conversations, assistants, prevConversations, prevMessages, prevResolved] =
      await Promise.all([
        prisma.message.findMany({
          where: { workspaceId, createdAt: { gte: since } },
          select: { id: true, role: true, createdAt: true, conversationId: true, citations: true },
        }),
        prisma.conversation.findMany({
          where: { workspaceId, createdAt: { gte: since } },
          select: {
            id: true,
            assistantId: true,
            channel: true,
            createdAt: true,
            resolved: true,
            rating: true,
          },
        }),
        prisma.assistant.findMany({
          where: { workspaceId },
          select: { id: true, name: true },
        }),
        prisma.conversation.count({ where: { workspaceId, createdAt: { gte: prevSince, lt: since } } }),
        prisma.message.count({ where: { workspaceId, createdAt: { gte: prevSince, lt: since } } }),
        prisma.conversation.count({
          where: { workspaceId, resolved: true, createdAt: { gte: prevSince, lt: since } },
        }),
      ]);

    const messages = rows.map(({ id, role, createdAt, conversationId }) => ({ id, role, createdAt, conversationId }));
    const answers = rows.filter((m) => m.role === "ASSISTANT");

    // Questions whose answer cited nothing: likely gaps in the docs.
    const uncited = uncitedAnswers(answers);
    const gapConversationIds = [...new Set(uncited.map((a) => a.conversationId))].slice(0, 50);
    const questions = gapConversationIds.length
      ? await prisma.message.findMany({
          where: { workspaceId, role: "USER", conversationId: { in: gapConversationIds } },
          select: { conversationId: true, createdAt: true, content: true },
        })
      : [];
    const assistantOf = new Map(conversations.map((c) => [c.id, c.assistantId]));

    return NextResponse.json({
      days,
      messages,
      conversations,
      assistants,
      previous: { conversations: prevConversations, messages: prevMessages, resolved: prevResolved },
      answers: { total: answers.length, cited: answers.length - uncited.length },
      topDocuments: topDocuments(answers),
      gaps: findGaps(uncited, questions, assistantOf),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
