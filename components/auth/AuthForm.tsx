"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { signIn } from "next-auth/react";
import { ThemeToggle } from "@/components/theme-toggle";
import { TryDemoButton } from "@/components/demo/TryDemoButton";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function nextDestination() {
    const pending =
      typeof window !== "undefined"
        ? sessionStorage.getItem("pending_invite_token")
        : null;
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

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        throw new Error("Incorrect email or password.");
      }
      router.push(nextDestination());
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper grid md:grid-cols-2">
      <div className="hidden md:flex flex-col justify-between p-10 bg-ink text-paper relative overflow-hidden">
        <Link href="/" className="flex items-center gap-2 relative z-10">
          <div className="size-7 rounded-md bg-signal flex items-center justify-center text-white text-sm">
            ✦
          </div>
          <span className="font-display text-lg font-semibold">SupportAI</span>
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10"
        >
          <p
            className="font-display text-3xl leading-tight"
            style={{ letterSpacing: "-0.01em" }}
          >
            &ldquo;We shut down our $400/mo helpdesk the day SupportAI hit 78%
            resolution.&rdquo;
          </p>
          <div className="mt-5 font-mono-caps text-paper/60">
            Priya Shah — Northwind
          </div>
        </motion.div>
        <div className="font-mono text-[11px] text-paper/40 relative z-10">
          © 2026 SupportAI Labs
        </div>
      </div>

      <div className="relative flex flex-col items-center justify-center p-8">
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm"
        >
          <Link href="/" className="md:hidden flex items-center gap-2 mb-10">
            <div className="size-7 rounded-md bg-ink flex items-center justify-center text-paper text-sm">
              ✦
            </div>
            <span className="font-display text-lg font-semibold text-ink">
              SupportAI
            </span>
          </Link>
          <div className="font-mono-caps text-signal mb-3">
            {isSignup ? "Free forever · No card" : "Welcome back"}
          </div>
          <h1
            className="font-display text-4xl font-semibold text-ink leading-tight"
            style={{ letterSpacing: "-0.02em" }}
          >
            {isSignup ? "Create your workspace." : "Sign in to SupportAI."}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {isSignup
              ? "Your first assistant in under five minutes."
              : "Pick up where you left off."}
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            {isSignup && (
              <Field
                label="Your name"
                value={name}
                onChange={setName}
                type="text"
                placeholder="Ada Lovelace"
                autoComplete="name"
              />
            )}
            <Field
              label="Email"
              value={email}
              onChange={setEmail}
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              required
            />
            <Field
              label="Password"
              value={password}
              onChange={setPassword}
              type="password"
              placeholder="••••••••"
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
              minLength={8}
            />
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-signal text-white rounded-md font-medium hover:bg-[#e84a26] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-8px_rgba(255,90,54,0.5)] transition-all duration-150 disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {loading ? "One sec…" : isSignup ? "Create workspace →" : "Sign in →"}
            </button>
          </form>

          {!isSignup && (
            <div className="mt-6">
              <div className="flex items-center gap-3 font-mono-caps text-muted-foreground">
                <span className="h-px flex-1 bg-line" />
                or
                <span className="h-px flex-1 bg-line" />
              </div>
              <TryDemoButton
                label="Try the demo, no sign-up"
                className="mt-6 w-full"
              />
              {demoUnavailable && (
                <p className="mt-3 text-sm text-destructive text-center">
                  The demo is unavailable right now. Please try again shortly.
                </p>
              )}
            </div>
          )}

          <p className="mt-8 text-sm text-muted-foreground text-center">
            {isSignup ? "Already have an account? " : "New to SupportAI? "}
            <Link
              href={isSignup ? "/login" : "/signup"}
              className="text-signal font-medium hover:underline"
            >
              {isSignup ? "Sign in" : "Get started free"}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type,
  placeholder,
  autoComplete,
  required,
  minLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="block">
      <span className="font-mono-caps text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        className="mt-1.5 w-full px-3 py-2.5 bg-paper-raised hairline rounded-md text-ink placeholder:text-muted-foreground focus:border-signal focus:outline-none transition-colors"
      />
    </label>
  );
}
