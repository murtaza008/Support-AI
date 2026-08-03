"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ThemeToggle } from "@/components/theme-toggle";

export function Nav() {
  const { status } = useSession();
  const authed = status === "authenticated";

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-paper/80 border-b border-line/60">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="size-7 rounded-md bg-ink flex items-center justify-center text-paper text-sm">
            ✦
          </div>
          <span className="font-display text-lg font-semibold tracking-tight text-ink">
            SupportAI
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-ink transition-colors">
            Features
          </a>
          <a href="#pricing" className="hover:text-ink transition-colors">
            Pricing
          </a>
          <a href="#faq" className="hover:text-ink transition-colors">
            FAQ
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {authed ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center text-sm font-medium text-paper bg-ink hover:bg-signal transition-all duration-150 px-4 py-2 rounded-md"
            >
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-flex text-sm text-ink hover:text-signal transition-colors px-3 py-2"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center text-sm font-medium text-paper bg-ink hover:bg-signal transition-all duration-150 px-4 py-2 rounded-md"
              >
                Get started free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
