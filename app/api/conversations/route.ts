import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { requireWorkspaceMember } from "@/lib/workspace";
import { handleApiError } from "@/lib/handle-error";

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const workspaceId = z.string().parse(searchParams.get("workspaceId"));
    await requireWorkspaceMember(userId, workspaceId);

    const conversations = await prisma.conversation.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { assistant: { select: { name: true } } },
    });
    return NextResponse.json(conversations);
  } catch (error) {
    return handleApiError(error);
  }
}
