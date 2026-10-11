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
    const { id } = await context.params;
    const userId = await requireUserId();
    const doc = await prisma.document.findUniqueOrThrow({
      where: { id },
      include: {
        chunks: {
          orderBy: { chunkIndex: "asc" },
          select: { id: true, chunkIndex: true, content: true, tokenCount: true },
        },
      },
    });
    await requireWorkspaceMember(userId, doc.workspaceId);

    return NextResponse.json(doc);
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
    const userId = await requireUserId();
    const doc = await prisma.document.findUniqueOrThrow({ where: { id } });
    await requireWorkspaceMember(userId, doc.workspaceId);

    await prisma.document.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
