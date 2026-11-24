import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { requireWorkspaceMember } from "@/lib/workspace";
import { handleApiError } from "@/lib/handle-error";
import type { WorkspaceSummary } from "@/lib/workspace-summary";

const DAY = 24 * 60 * 60 * 1000;

/**
 * Small counts used across the shell (nav hover cards, command palette).
 * Counts only, so it stays cheap; any member can read it.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: workspaceId } = await context.params;
    const userId = await requireUserId();
    await requireWorkspaceMember(userId, workspaceId);

    const now = Date.now();
    const d30 = new Date(now - 30 * DAY);
    const d60 = new Date(now - 60 * DAY);
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const [
      assistants,
      docsByStatus,
      chunks,
      last30d,
      prev30d,
      todayCount,
      widget30d,
      open30d,
      members,
      pendingInvites,
    ] = await Promise.all([
      prisma.assistant.count({ where: { workspaceId } }),
      prisma.document.groupBy({ by: ["status"], where: { workspaceId }, _count: { _all: true } }),
      prisma.document.aggregate({ where: { workspaceId }, _sum: { chunkCount: true } }),
      prisma.conversation.count({ where: { workspaceId, createdAt: { gte: d30 } } }),
      prisma.conversation.count({ where: { workspaceId, createdAt: { gte: d60, lt: d30 } } }),
      prisma.conversation.count({ where: { workspaceId, createdAt: { gte: today } } }),
      prisma.conversation.count({ where: { workspaceId, channel: "WIDGET", createdAt: { gte: d30 } } }),
      prisma.conversation.count({ where: { workspaceId, resolved: false, createdAt: { gte: d30 } } }),
      prisma.workspaceMember.count({ where: { workspaceId } }),
      prisma.workspaceInvite.count({ where: { workspaceId, acceptedAt: null } }),
    ]);

    const byStatus = (s: string) => docsByStatus.find((d) => d.status === s)?._count._all ?? 0;
    const summary: WorkspaceSummary = {
      assistants,
      documents: {
        total: docsByStatus.reduce((n, d) => n + d._count._all, 0),
        ready: byStatus("READY"),
        processing: byStatus("PROCESSING") + byStatus("PENDING"),
        error: byStatus("ERROR"),
        chunks: chunks._sum.chunkCount ?? 0,
      },
      conversations: { last30d, prev30d, today: todayCount, widget30d, open30d },
      members,
      pendingInvites,
    };
    return NextResponse.json(summary);
  } catch (error) {
    return handleApiError(error);
  }
}
