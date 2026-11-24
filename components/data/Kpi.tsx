"use client";

import type { ReactNode } from "react";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { HoverCard } from "@/components/ui/hover-card";
import { Skeleton } from "@/components/ui/primitives";
import { Sparkline } from "./Sparkline";
import { cn } from "@/lib/utils";

/**
 * KPI tile: label, a number that counts to its value (final value in
 * data-value), the change vs the previous period, an optional sparkline, and a
 * hover card with the breakdown behind the number. The tile is focusable so
 * keyboard users get the same breakdown.
 */
export function Kpi({
  label,
  value,
  format,
  suffix,
  delta,
  deltaLabel,
  spark,
  breakdown,
  loading,
  className,
}: {
  label: string;
  value: number | null;
  format?: (n: number) => string;
  suffix?: string;
  delta?: ReactNode;
  deltaLabel?: string;
  spark?: number[];
  breakdown?: ReactNode;
  loading?: boolean;
  className?: string;
}) {
  const tile = (
    <div
      tabIndex={breakdown ? 0 : undefined}
      className={cn("panel flex h-full min-w-0 flex-col p-4 outline-none", breakdown && "lift cursor-default", className)}
    >
      <span className="text-[13px] font-medium text-fg-muted">{label}</span>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-24" />
      ) : (
        <span className="mt-1.5 font-display text-[28px] font-semibold leading-none tracking-[-0.02em] text-fg">
          {value === null ? (
            <>
              <span aria-hidden>—</span>
              <span className="sr-only">Not enough data</span>
            </>
          ) : (
            <>
              <AnimatedNumber value={value} format={format} />
              {suffix && <span className="ml-0.5 text-[18px] text-fg-muted">{suffix}</span>}
            </>
          )}
        </span>
      )}
      <span className="mt-2 flex min-h-[18px] items-center gap-1.5">
        {!loading && delta}
        {!loading && deltaLabel && <span className="truncate text-[12px] text-fg-muted">{deltaLabel}</span>}
      </span>
      {spark && !loading && <Sparkline values={spark} className="mt-3" />}
    </div>
  );
  if (!breakdown) return tile;
  return (
    <HoverCard trigger={tile} side="bottom" align="start" width={280}>
      <p className="font-medium">{label}</p>
      {breakdown}
    </HoverCard>
  );
}
