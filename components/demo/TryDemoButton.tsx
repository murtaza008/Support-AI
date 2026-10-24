"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

/**
 * Native form POST to /api/demo/login: the server signs the visitor into the
 * demo account and redirects to the dashboard with a full page load.
 */
export function TryDemoButton({
  className = "",
  label = "Try demo",
}: {
  className?: string;
  label?: string;
}) {
  const [pending, setPending] = useState(false);
  return (
    <form action="/api/demo/login" method="post" onSubmit={() => setPending(true)}>
      <button
        type="submit"
        disabled={pending}
        className={`group inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md font-medium text-ink hairline bg-paper-raised hover:border-ink/40 hover:-translate-y-0.5 transition-all duration-150 disabled:opacity-60 disabled:hover:translate-y-0 ${className}`}
      >
        <Sparkles className="size-4 text-signal" />
        {pending ? "Opening demo…" : label}
      </button>
    </form>
  );
}
