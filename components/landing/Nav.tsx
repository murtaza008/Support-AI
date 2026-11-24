"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";

const links = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export function Nav() {
  const { status } = useSession();
  const authed = status === "authenticated";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="SupportAI home" className="rounded-md">
          <Logo />
        </Link>
        <nav aria-label="Sections" className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-1.5 text-[13.5px] text-fg-muted transition-colors hover:bg-sunken hover:text-fg"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle className="hidden sm:inline-flex" />
          {authed ? (
            <Link href="/dashboard" data-press="" className={buttonVariants({ variant: "primary", size: "sm" })}>
              Open dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm", className: "hidden sm:inline-flex" })}>
                Sign in
              </Link>
              <Link href="/signup" data-press="" className={buttonVariants({ variant: "primary", size: "sm" })}>
                Start free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
