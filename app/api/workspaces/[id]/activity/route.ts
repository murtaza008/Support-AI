import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { requireWorkspaceMember } from "@/lib/workspace";
import { handleApiError } from "@/lib/handle-error";
import { ACTIVITY_LIMIT, ACTIVITY_WINDOW_DAYS, buildActivity } from "@/lib/activity";

/** Recent real events in the workspace, newest first. Any member can read it. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: workspaceId } = await context.params;
    const userId = await requireUserId();
    await requireWorkspaceMember(userId, workspaceId);

    const since = new Date(Date.now() - ACTIVITY_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const take = ACTIVITY_LIMIT;

    const [documents, widgetConversations, members, invites] = await Promise.all([
      prisma.document.findMany({
        where: { workspaceId, updatedAt: { gte: since }, status: { in: ["READY", "ERROR"] } },
        orderBy: { updatedAt: "desc" },
        take,
        select: { id: true, name: true, status: true, error: true, chunkCount: true, updatedAt: true },
      }),
      prisma.conversation.findMany({
        where: { workspaceId, channel: "WIDGET", createdAt: { gte: since } },
        orderBy: { createdAt: "desc" },
        take,
        select: {
          id: true,
          createdAt: true,
          assistant: { select: { name: true } },
          messages: {
            where: { role: "USER" },
            orderBy: { createdAt: "asc" },
            take: 1,
            select: { content: true },
          },
        },
      }),
      prisma.workspaceMember.findMany({
        where: { workspaceId, createdAt: { gte: since } },
        orderBy: { createdAt: "desc" },
        take,
        select: {
          id: true,
          userId: true,
          role: true,
          createdAt: true,
          user: { select: { displayName: true, email: true } },
        },
      }),
      prisma.workspaceInvite.findMany({
        where: { workspaceId, acceptedAt: null, createdAt: { gte: since } },
        orderBy: { createdAt: "desc" },
        take,
        select: { id: true, email: true, role: true, createdAt: true },
      }),
    ]);

    return NextResponse.json(
      buildActivity({ documents, widgetConversations, members, invites }, userId),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
