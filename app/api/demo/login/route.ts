import { NextResponse } from "next/server";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { DEMO_EMAIL } from "@/lib/demo/constants";

/**
 * "Try demo": a plain form POST signs the visitor into the shared demo account
 * on the server (the password never reaches the browser), then does a full
 * page redirect so the dashboard boots with a fresh session and query cache.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin && origin !== url.origin) {
    return NextResponse.json({ error: "Cross-site request refused." }, { status: 403 });
  }

  const unavailable = NextResponse.redirect(new URL("/login?demo=unavailable", url), 303);
  const password = process.env.DEMO_PASSWORD;
  if (!password) return unavailable;

  try {
    const result: unknown = await signIn("credentials", {
      email: DEMO_EMAIL,
      password,
      redirectTo: "/dashboard",
      redirect: false,
    });
    // Success redirects to `redirectTo`; config errors (e.g. an untrusted host)
    // come back as some other URL without throwing, so check positively.
    if (typeof result !== "string" || new URL(result, url).pathname !== "/dashboard") {
      console.error("Demo sign-in did not complete:", result);
      return unavailable;
    }
  } catch (error) {
    if (error instanceof AuthError) return unavailable;
    throw error;
  }

  return NextResponse.redirect(new URL("/dashboard", url), 303);
}
