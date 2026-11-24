"use client";

import { useState } from "react";
import { WEEKDAYS, busiest, hourLabel } from "@/lib/analytics-view";

/**
 * Customer messages by weekday and hour. Sequential: one hue, light to dark.
 * Pointer hover shows the exact count; a table view covers keyboard and
 * screen-reader users.
 */
export function Heatmap({ grid }: { grid: number[][] }) {
  const [tip, setTip] = useState<{ day: number; hour: number; x: number; y: number } | null>(null);
  const max = Math.max(1, ...grid.flat());
  const peak = busiest(grid);
  const total = grid.flat().reduce((a, b) => a + b, 0);

  return (
    <div className="relative">
      <p className="text-[13px] text-fg-muted">
        {peak
          ? `Busiest: ${WEEKDAYS[peak.day]} around ${hourLabel(peak.hour)} (${peak.count} customer ${peak.count === 1 ? "message" : "messages"}).`
          : "No customer messages in this period yet."}
      </p>
      <div className="mt-3 overflow-x-auto scrollbar-thin" onPointerLeave={() => setTip(null)}>
        <div className="grid min-w-[560px] grid-cols-[36px_repeat(24,minmax(0,1fr))] gap-[2px]" aria-hidden>
          {grid.map((row, d) => (
            <div key={d} className="contents">
              <span className="pr-1 text-[11px] leading-[18px] text-fg-muted">{WEEKDAYS[d]}</span>
              {row.map((v, h) => (
                <span
                  key={h}
                  onPointerEnter={(e) => {
                    const r = e.currentTarget.getBoundingClientRect();
                    const parent = e.currentTarget.closest(".relative")!.getBoundingClientRect();
                    setTip({ day: d, hour: h, x: r.left - parent.left + r.width / 2, y: r.top - parent.top });
                  }}
                  className="pop h-[18px] rounded-[3px]"
                  style={{
                    background:
                      v === 0
                        ? "var(--sunken)"
                        : `color-mix(in oklch, var(--chart-1) ${Math.round(18 + (v / max) * 82)}%, var(--surface))`,
                    animationDelay: `${Math.min(d * 24 + h, 160) * 3}ms`,
                  }}
                />
              ))}
            </div>
          ))}
          <span />
          {Array.from({ length: 24 }, (_, h) => (
            <span key={h} className="pt-1 text-center text-[10px] text-fg-muted">
              {h % 3 === 0 ? hourLabel(h) : ""}
            </span>
          ))}
        </div>
      </div>
      {tip && (
        <div
          role="tooltip"
          className="panel-raised pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full px-2.5 py-1.5 text-[12px]"
          style={{ left: tip.x, top: tip.y - 6 }}
        >
          <span className="font-medium text-fg">
            {WEEKDAYS[tip.day]} {hourLabel(tip.hour)}
          </span>
          <span className="text-fg-muted"> · {grid[tip.day][tip.hour]} messages</span>
        </div>
      )}
      <details className="mt-3 text-[13px]">
        <summary className="cursor-pointer text-fg-muted hover:text-fg">Show as table</summary>
        <div className="mt-2 max-h-64 overflow-auto scrollbar-thin" tabIndex={0} aria-label="Messages by weekday and hour">
          <table className="w-full text-left text-[12px]">
            <caption className="sr-only">
              Customer messages by weekday and hour, {total} in total
            </caption>
            <thead>
              <tr className="text-fg-muted">
                <th scope="col" className="py-1 pr-3 font-medium">
                  Day
                </th>
                <th scope="col" className="py-1 pr-3 font-medium">
                  Busiest hour
                </th>
                <th scope="col" className="py-1 font-medium">
                  Messages
                </th>
              </tr>
            </thead>
            <tbody>
              {grid.map((row, d) => {
                const sum = row.reduce((a, b) => a + b, 0);
                const top = row.indexOf(Math.max(...row));
                return (
                  <tr key={d} className="border-t border-border">
                    <th scope="row" className="py-1 pr-3 font-medium text-fg">
                      {WEEKDAYS[d]}
                    </th>
                    <td className="py-1 pr-3 text-fg">{sum > 0 ? hourLabel(top) : "—"}</td>
                    <td className="py-1 tabular text-fg">{sum}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
