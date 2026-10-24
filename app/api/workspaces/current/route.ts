import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";
import { getCurrentWorkspace } from "@/lib/workspace";
import { handleApiError } from "@/lib/handle-error";
import { DEMO_WORKSPACE_SLUG } from "@/lib/demo/constants";

export async function GET() {
  try {
    const userId = await requireUserId();
    const workspace = await getCurrentWorkspace(userId);
    if (!workspace) return NextResponse.json(null);
    return NextResponse.json({ ...workspace, isDemo: workspace.slug === DEMO_WORKSPACE_SLUG });
  } catch (error) {
    return handleApiError(error);
  }
}
