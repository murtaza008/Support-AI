import type { ReactNode } from "react";
import { staggerStyle } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export type BarItem = {
  key: string;
  label: ReactNode;
  value: number;
  /** Shown instead of the raw value, e.g. "12 answers". */
  display?: ReactNode;
  /** Optional per-bar colour (categorical); defaults to the accent series. */
  color?: string;
};

/**
 * Horizontal bars that grow from their start, with labels in text colours.
 * Plain HTML (a list), so it reads well with a screen reader too.
 */
export function BarList({ items, className, label }: { items: BarItem[]; className?: string; label: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ol aria-label={label} className={cn("stagger space-y-2.5", className)}>
      {items.map((item, i) => (
        <li key={item.key} style={staggerStyle(i)}>
          <div className="flex items-baseline justify-between gap-3 text-[13px]">
            <span className="min-w-0 truncate text-fg">{item.label}</span>
            <span className="shrink-0 tabular text-fg-muted">{item.display ?? item.value.toLocaleString("en-US")}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sunken">
            <div
              className="grow-x h-full rounded-full"
              style={{
                width: `${Math.max(2, (item.value / max) * 100)}%`,
                background: item.color ?? "var(--chart-1)",
                animationDelay: `${Math.min(i, 15) * 35}ms`,
              }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
