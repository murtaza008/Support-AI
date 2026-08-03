import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { requireWorkspaceRole } from "@/lib/workspace";
import { handleApiError } from "@/lib/handle-error";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; inviteId: string }> },
) {
  try {
    const { id: workspaceId, inviteId } = await context.params;
    const userId = await requireUserId();
    await requireWorkspaceRole(userId, workspaceId, ["OWNER", "ADMIN"]);

    const invite = await prisma.workspaceInvite.findUnique({ where: { id: inviteId } });
    if (!invite || invite.workspaceId !== workspaceId) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }
    await prisma.workspaceInvite.delete({ where: { id: inviteId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
