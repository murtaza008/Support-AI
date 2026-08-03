import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";
import { requireWorkspaceMember } from "@/lib/workspace";
import { handleApiError } from "@/lib/handle-error";
import { extractTextFromFile } from "@/lib/parse-file";
import { ingestDocument } from "@/lib/rag";

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const form = await request.formData();
    const file = form.get("file");
    const workspaceId = form.get("workspaceId");
    const assistantId = form.get("assistantId");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (typeof workspaceId !== "string") {
      return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });
    }
    await requireWorkspaceMember(userId, workspaceId);

    const buffer = Buffer.from(await file.arrayBuffer());
    const content = await extractTextFromFile(buffer, file.name);

    const result = await ingestDocument({
      workspaceId,
      assistantId: typeof assistantId === "string" && assistantId ? assistantId : null,
      name: file.name,
      sourceType: "FILE",
      content,
      createdById: userId,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
