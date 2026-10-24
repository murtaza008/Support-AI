import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { resetDemoWorkspace } from "@/lib/demo/reset";

export const maxDuration = 60;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Daily demo reset, called by Vercel Cron (see vercel.json) with `Authorization: Bearer $CRON_SECRET`. */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const report = await resetDemoWorkspace();
    return NextResponse.json({ ok: true, ...report });
  } catch (error) {
    console.error("Demo reset failed:", error);
    return NextResponse.json({ ok: false, error: "Demo reset failed" }, { status: 500 });
  }
}
