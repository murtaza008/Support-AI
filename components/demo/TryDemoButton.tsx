"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Native form POST to /api/demo/login: the server signs the visitor into the
 * demo account and redirects to the dashboard with a full page load.
 */
export function TryDemoButton({
  className = "",
  label = "Try demo",
  size = "md",
}: {
  className?: string;
  label?: string;
  size?: "sm" | "md" | "lg";
}) {
  const [pending, setPending] = useState(false);
  return (
    <form action="/api/demo/login" method="post" onSubmit={() => setPending(true)}>
      <button
        type="submit"
        disabled={pending}
        data-press=""
        className={cn(buttonVariants({ variant: "secondary", size }), "group", className)}
      >
        {pending ? "Opening demo…" : label}
        <ArrowRight aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5" />
      </button>
    </form>
  );
}
