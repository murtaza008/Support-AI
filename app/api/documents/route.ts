import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { requireWorkspaceMember } from "@/lib/workspace";
import { handleApiError } from "@/lib/handle-error";
import { ingestDocument } from "@/lib/rag";

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const workspaceId = z.string().parse(searchParams.get("workspaceId"));
    await requireWorkspaceMember(userId, workspaceId);

    const documents = await prisma.document.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(documents);
  } catch (error) {
    return handleApiError(error);
  }
}

const IngestInput = z.object({
  workspaceId: z.string(),
  assistantId: z.string().nullable().optional(),
  name: z.string().trim().min(1).max(200),
  sourceType: z.enum(["TEXT", "URL"]),
  sourceUrl: z.url().nullable().optional(),
  content: z.string().min(1).max(500_000),
});

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const input = IngestInput.parse(await request.json().catch(() => null));
    await requireWorkspaceMember(userId, input.workspaceId);

    const result = await ingestDocument({
      workspaceId: input.workspaceId,
      assistantId: input.assistantId ?? null,
      name: input.name,
      sourceType: input.sourceType,
      sourceUrl: input.sourceUrl ?? null,
      content: input.content,
      createdById: userId,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
