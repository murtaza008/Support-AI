import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { requireWorkspaceMember } from "@/lib/workspace";
import { handleApiError } from "@/lib/handle-error";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: conversationId } = await context.params;
    const userId = await requireUserId();

    const conversation = await prisma.conversation.findUniqueOrThrow({
      where: { id: conversationId },
    });
    await requireWorkspaceMember(userId, conversation.workspaceId);

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(messages);
  } catch (error) {
    return handleApiError(error);
  }
}
