"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const SOURCES = [
  {
    doc: "Refunds and Cancellations",
    text: "Annual plans: you can get a full refund within 30 days of purchase or renewal. After 30 days, annual plans are not refundable, but you keep access until the end of the year you paid for.",
  },
  {
    doc: "Refunds and Cancellations",
    text: "Cancel the plan first, then email billing@nimbus-pm.example from the workspace owner's address with your workspace name and the invoice number.",
  },
];

function Cite({ n, active, setActive }: { n: number; active: number | null; setActive: (n: number | null) => void }) {
  return (
    <button
      type="button"
      onPointerEnter={() => setActive(n)}
      onPointerLeave={() => setActive(null)}
      onFocus={() => setActive(n)}
      onBlur={() => setActive(null)}
      onClick={() => setActive(active === n ? null : n)}
      aria-describedby={`cite-src-${n}`}
      className={cn(
        "mx-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded px-1 align-[1px] font-mono text-[11px] font-medium transition-colors",
        active === n ? "bg-accent text-accent-fg" : "bg-accent-soft text-accent-text",
      )}
    >
      {n + 1}
    </button>
  );
}

/** Citation markers point at the exact passage the answer used. */
export function CitationDemo() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="ml-auto max-w-[85%] rounded-xl rounded-br-sm bg-inverse px-3 py-2 text-[13.5px] text-inverse-fg">
        Can I get a refund on my annual plan?
      </div>
      <div className="max-w-[92%] rounded-xl rounded-bl-sm border border-border bg-surface-2 px-3 py-2 text-[13.5px] leading-relaxed text-fg">
        Yes. Annual plans can be refunded in full within 30 days of purchase or renewal
        <span className="whitespace-nowrap">
          <Cite n={0} active={active} setActive={setActive} />.
        </span>{" "}
        Cancel the plan first, then email billing from the workspace owner&rsquo;s address
        <span className="whitespace-nowrap">
          <Cite n={1} active={active} setActive={setActive} />.
        </span>
      </div>
      <ol className="mt-auto space-y-1.5">
        {SOURCES.map((s, i) => (
          <li
            key={i}
            id={`cite-src-${i}`}
            className={cn(
              "rounded-md border px-2.5 py-1.5 text-[12.5px] transition-[border-color,background-color] duration-200",
              active === i ? "border-accent bg-accent-soft" : "border-border bg-surface",
            )}
          >
            <span className="font-mono text-[11px] text-fg-muted">
              [{i + 1}] {s.doc}
            </span>
            <p className="mt-0.5 text-fg">{s.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
