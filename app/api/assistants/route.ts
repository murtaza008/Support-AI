import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { DemoLockedError, requireUser, requireUserId } from "@/lib/session";
import { DEMO_MAX_ASSISTANTS } from "@/lib/demo/constants";
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
    const user = await requireUser();
    const userId = user.id;
    const input = CreateAssistantInput.parse(await request.json().catch(() => null));
    await requireWorkspaceMember(userId, input.workspaceId);
    if (user.isDemo) {
      const count = await prisma.assistant.count({ where: { workspaceId: input.workspaceId } });
      if (count >= DEMO_MAX_ASSISTANTS) {
        throw new DemoLockedError(
          `The demo allows up to ${DEMO_MAX_ASSISTANTS} assistants. Sign up free to create as many as you like.`,
        );
      }
    }

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
