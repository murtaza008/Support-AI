import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireNonDemoUserId, requireUserId } from "@/lib/session";
import { requireWorkspaceMember, requireWorkspaceRole } from "@/lib/workspace";
import { handleApiError } from "@/lib/handle-error";

const UpdateAssistantInput = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  tone: z.enum(["friendly", "professional", "playful"]).optional(),
  systemPrompt: z.string().trim().max(4000).nullable().optional(),
  brandColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const userId = await requireUserId();
    const assistant = await prisma.assistant.findUniqueOrThrow({ where: { id } });
    await requireWorkspaceMember(userId, assistant.workspaceId);
    return NextResponse.json(assistant);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const userId = await requireNonDemoUserId("Editing assistants");
    const existing = await prisma.assistant.findUniqueOrThrow({ where: { id } });
    await requireWorkspaceMember(userId, existing.workspaceId);

    const data = UpdateAssistantInput.parse(await request.json().catch(() => null));
    const assistant = await prisma.assistant.update({ where: { id }, data });
    return NextResponse.json(assistant);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const userId = await requireNonDemoUserId("Deleting assistants");
    const existing = await prisma.assistant.findUniqueOrThrow({ where: { id } });
    await requireWorkspaceRole(userId, existing.workspaceId, ["OWNER", "ADMIN"]);

    await prisma.assistant.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
