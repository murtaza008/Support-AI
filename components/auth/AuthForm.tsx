"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { TryDemoButton } from "@/components/demo/TryDemoButton";
import { CitationDemo } from "@/components/landing/demos/CitationDemo";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";

export function AuthForm({
  mode,
  demoUnavailable = false,
}: {
  mode: "login" | "signup";
  demoUnavailable?: boolean;
}) {
  const isSignup = mode === "signup";
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function nextDestination() {
    const pending = typeof window !== "undefined" ? sessionStorage.getItem("pending_invite_token") : null;
    if (pending) {
      sessionStorage.removeItem("pending_invite_token");
      return `/invite/${pending}`;
    }
    return isSignup ? "/onboarding" : "/dashboard";
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isSignup) {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Could not create your account.");
        }
      }
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) throw new Error("Incorrect email or password.");
      router.push(nextDestination());
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="SupportAI home" className="rounded-md">
            <Logo />
          </Link>
          <ThemeToggle />
        </div>

        <main id="main" className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="text-[28px] font-semibold leading-tight text-fg">
            {isSignup ? "Create your workspace" : "Sign in to SupportAI"}
          </h1>
          <p className="mt-2 text-[14.5px] text-fg-muted">
            {isSignup
              ? "Free to start. Upload a document and test your assistant in a few minutes."
              : "Welcome back. Pick up where your team left off."}
          </p>

          {demoUnavailable && (
            <p role="alert" className="mt-5 rounded-md border border-warning/40 bg-warning-soft px-3 py-2 text-[13px] text-warning-text">
              The live demo isn&rsquo;t available right now. You can still create a free account.
            </p>
          )}

          <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate={false}>
            {isSignup && (
              <Field label="Your name" htmlFor="auth-name">
                <Input
                  id="auth-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  placeholder="Ada Lovelace"
                />
              </Field>
            )}
            <Field label="Work email" htmlFor="auth-email">
              <Input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@company.com"
                required
              />
            </Field>
            <Field label="Password" htmlFor="auth-password" hint={isSignup ? "At least 8 characters." : undefined}>
              <div className="relative">
                <Input
                  id="auth-password"
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  required
                  minLength={8}
                  aria-describedby={isSignup ? "auth-password-hint" : undefined}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? "Hide password" : "Show password"}
                  aria-pressed={show}
                  className="absolute right-1 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded text-fg-subtle hover:text-fg"
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </Field>

            {error && (
              <p role="alert" className="rounded-md border border-danger-text/30 bg-danger-soft px-3 py-2 text-[13px] text-danger-text">
                {error}
              </p>
            )}

            <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
              {loading ? (isSignup ? "Creating your account…" : "Signing in…") : isSignup ? "Create account" : "Sign in"}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-[12px] text-fg-muted">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>
          <TryDemoButton label="Open the live demo, no sign-up" className="w-full" />

          <p className="mt-8 text-center text-[13.5px] text-fg-muted">
            {isSignup ? "Already have an account? " : "New to SupportAI? "}
            <Link href={isSignup ? "/login" : "/signup"} className="font-medium text-accent-text underline-offset-4 hover:underline">
              {isSignup ? "Sign in" : "Create a workspace"}
            </Link>
          </p>
        </main>
      </div>

      <aside
        aria-label="What answers look like"
        className="relative hidden border-l border-border bg-surface-2 lg:flex lg:flex-col lg:justify-center lg:px-14"
      >
        <div aria-hidden className="grid-backdrop pointer-events-none absolute inset-0" />
        <div className="relative mx-auto w-full max-w-md">
          <p className="eyebrow">What your customers see</p>
          <p className="mt-2 text-[22px] font-semibold leading-snug text-fg">
            Answers that point at the exact passage they came from.
          </p>
          <div className="panel mt-8 h-[400px] p-5">
            <CitationDemo />
          </div>
          <p className="mt-4 text-[13px] text-fg-muted">Point at a number to see its source.</p>
        </div>
      </aside>
    </div>
  );
}
