import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { requireWorkspaceMember } from "@/lib/workspace";
import { handleApiError } from "@/lib/handle-error";

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const workspaceId = z.string().parse(searchParams.get("workspaceId"));
    await requireWorkspaceMember(userId, workspaceId);

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [messages, conversations, assistants] = await Promise.all([
      prisma.message.findMany({
        where: { workspaceId, createdAt: { gte: since } },
        select: { id: true, role: true, createdAt: true, conversationId: true },
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
    ]);

    return NextResponse.json({ messages, conversations, assistants });
  } catch (error) {
    return handleApiError(error);
  }
}
