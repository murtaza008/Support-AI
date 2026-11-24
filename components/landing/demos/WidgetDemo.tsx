"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const COLORS = ["#0e6b5d", "#ff5a36", "#3d6bff", "#16181a", "#b7791f"];

/** The real embed snippet (see README "Embedding the chat widget"), live-previewed. */
export function WidgetDemo() {
  const [color, setColor] = useState(COLORS[0]);
  const [copied, setCopied] = useState(false);
  const snippet = `<script
  src="https://your-app.example/api/public/widget/embed.js"
  data-assistant="YOUR_ASSISTANT_ID"
  data-title="Chat with us"
  data-color="${color}"></script>`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <fieldset>
        <legend className="text-[13px] font-medium text-fg">Brand colour</legend>
        <div className="mt-2 flex gap-2">
          {COLORS.map((c) => (
            <label key={c} className="relative cursor-pointer">
              <input
                type="radio"
                name="widget-color"
                value={c}
                checked={color === c}
                onChange={() => setColor(c)}
                className="peer sr-only"
              />
              <span className="sr-only">{c}</span>
              <span
                aria-hidden
                className="block size-7 rounded-full border border-border-strong ring-offset-2 ring-offset-surface peer-checked:ring-2 peer-checked:ring-fg peer-focus-visible:ring-2 peer-focus-visible:ring-focus"
                style={{ background: c }}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <div className="relative">
        <pre tabIndex={0} aria-label="Embed snippet" className="overflow-x-auto rounded-md border border-border bg-sunken p-3 pr-11 font-mono text-[11.5px] leading-relaxed text-fg scrollbar-thin">
          <code>{snippet}</code>
        </pre>
        <button
          type="button"
          onClick={copy}
          data-press=""
          aria-label={copied ? "Copied" : "Copy snippet"}
          className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-md border border-border bg-surface text-fg-muted hover:text-fg"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        </button>
      </div>

      <div className="relative mt-auto h-24 overflow-hidden rounded-md border border-dashed border-border-strong bg-surface-2">
        <span className="absolute left-3 top-2.5 text-[12px] text-fg-muted">Your website</span>
        <span
          aria-hidden
          className={cn("absolute bottom-3 right-3 flex size-11 items-center justify-center rounded-full text-white shadow-md transition-colors duration-300")}
          style={{ background: color }}
        >
          <MessageCircle className="size-5" />
        </span>
      </div>
    </div>
  );
}
