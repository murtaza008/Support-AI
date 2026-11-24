"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { chunkText } from "@/lib/chunker";

const SAMPLE = `# Refunds and Cancellations

## How to cancel
Workspace owners can cancel at any time from Settings > Billing > Cancel plan. After cancelling you keep paid features until the end of the period you've already paid for, then the workspace moves to the Free plan. Your projects and tasks are never deleted.

## Refund policy
Monthly plans: payments are non-refundable, except for your first paid charge, which can be refunded in full if you ask within 7 days.
Annual plans: you can get a full refund within 30 days of purchase or renewal. After 30 days, annual plans are not refundable, but you keep access until the end of the year you paid for.
Seat credits from removed members are applied to your next invoice and are not paid out as refunds.

## Requesting a refund
Cancel the plan first, then email billing@nimbus-pm.example from the workspace owner's address with your workspace name and the invoice number. Approved refunds go back to the original payment method within 5 to 10 business days, depending on your bank.

## Pausing instead of cancelling
Seasonal teams can pause a paid workspace once per year for up to 3 months. While paused you aren't billed and the workspace is read-only. Ask support to set up a pause.`;

/** Runs the real chunker from lib/chunker.ts in the browser. */
export function ChunkerDemo() {
  const [text, setText] = useState(SAMPLE);
  const deferred = useDeferredValue(text);
  const chunks = useMemo(() => chunkText(deferred), [deferred]);

  return (
    <div className="flex h-full flex-col gap-3">
      <label htmlFor="chunker-input" className="text-[13px] font-medium text-fg">
        Paste or edit a help doc
      </label>
      <textarea
        id="chunker-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        className="h-32 w-full resize-none rounded-md border border-border-strong bg-surface px-3 py-2 font-mono text-[12px] leading-relaxed text-fg focus-visible:border-accent focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent/20"
      />
      <p className="text-[13px] text-fg-muted" aria-live="polite">
        <span className="tabular font-medium text-fg">{deferred.length.toLocaleString("en-US")}</span> characters →{" "}
        <span className="tabular font-medium text-fg">{chunks.length}</span> {chunks.length === 1 ? "chunk" : "chunks"}
      </p>
      <ol className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto scrollbar-thin" aria-label="Chunks" tabIndex={0}>
        {chunks.map((c, i) => (
          <li key={`${i}-${c.length}`} className="rise rounded-md border border-border bg-surface-2 px-2.5 py-1.5" style={{ animationDelay: `${Math.min(i, 15) * 40}ms` }}>
            <div className="flex items-center justify-between gap-2 text-[11.5px] text-fg-muted">
              <span className="font-mono">chunk {i + 1}</span>
              <span className="tabular">{c.length} chars</span>
            </div>
            <p className="mt-0.5 line-clamp-2 text-[12.5px] text-fg">{c}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
