import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { requireWorkspaceRole, ForbiddenError } from "@/lib/workspace";
import { handleApiError } from "@/lib/handle-error";

const UpdateMemberInput = z.object({
  role: z.enum(["ADMIN", "MEMBER"]),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; memberId: string }> },
) {
  try {
    const { id: workspaceId, memberId } = await context.params;
    const userId = await requireUserId();
    await requireWorkspaceRole(userId, workspaceId, ["OWNER", "ADMIN"]);

    const member = await prisma.workspaceMember.findUnique({ where: { id: memberId } });
    if (!member || member.workspaceId !== workspaceId) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }
    if (member.role === "OWNER") throw new ForbiddenError("Cannot change the owner's role.");

    const { role } = UpdateMemberInput.parse(await request.json().catch(() => null));
    const updated = await prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role },
    });
    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; memberId: string }> },
) {
  try {
    const { id: workspaceId, memberId } = await context.params;
    const userId = await requireUserId();
    const callerRole = await requireWorkspaceRole(userId, workspaceId, [
      "OWNER",
      "ADMIN",
      "MEMBER",
    ]);

    const member = await prisma.workspaceMember.findUnique({ where: { id: memberId } });
    if (!member || member.workspaceId !== workspaceId) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }
    if (member.role === "OWNER") throw new ForbiddenError("Cannot remove the owner.");
    const isSelf = member.userId === userId;
    if (!isSelf && callerRole === "MEMBER") throw new ForbiddenError();

    await prisma.workspaceMember.delete({ where: { id: memberId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
