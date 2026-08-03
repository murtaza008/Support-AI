import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { requireWorkspaceMember } from "@/lib/workspace";
import { handleApiError } from "@/lib/handle-error";

const ListQuery = z.object({ workspaceId: z.string() });

const CreateAssistantInput = z.object({
  workspaceId: z.string(),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional(),
  tone: z.enum(["friendly", "professional", "playful"]).default("friendly"),
});

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const { workspaceId } = ListQuery.parse({
      workspaceId: searchParams.get("workspaceId"),
    });
    await requireWorkspaceMember(userId, workspaceId);

    const assistants = await prisma.assistant.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(assistants);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const input = CreateAssistantInput.parse(await request.json().catch(() => null));
    await requireWorkspaceMember(userId, input.workspaceId);

    const assistant = await prisma.assistant.create({
      data: {
        workspaceId: input.workspaceId,
        name: input.name,
        description: input.description || null,
        tone: input.tone,
        createdById: userId,
      },
    });
    return NextResponse.json(assistant, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
