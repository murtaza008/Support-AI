import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/theme-toggle";

/** Standalone pages outside the app shell: onboarding, invites, 404. */
export function CenteredPage({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-14 items-center justify-between border-b border-border px-4 sm:px-6">
        <Link href="/" aria-label="SupportAI home" className="rounded-md">
          <Logo />
        </Link>
        <div className="flex items-center gap-3">
          {aside}
          <ThemeToggle />
        </div>
      </header>
      <main id="main" className="relative flex flex-1 items-center justify-center px-4 py-12">
        <div aria-hidden className="grid-backdrop pointer-events-none absolute inset-0" />
        <div className="rise relative w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
