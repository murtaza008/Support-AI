import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/session";
import { handleApiError } from "@/lib/handle-error";

const FetchUrlInput = z.object({ url: z.url() });

export async function POST(request: Request) {
  try {
    await requireUserId();
    const { url } = FetchUrlInput.parse(await request.json().catch(() => null));

    const res = await fetch(url, {
      headers: { "User-Agent": "SupportAI-Ingestor/1.0" },
    });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 200_000);

    return NextResponse.json({ text });
  } catch (error) {
    return handleApiError(error);
  }
}
