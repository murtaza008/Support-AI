"use client";

import { useSyncExternalStore } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DayPoint } from "@/lib/analytics-view";

type Metric = "conversations" | "messages";

const reducedQuery = "(prefers-reduced-motion: reduce)";
function useReducedMotion() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(reducedQuery);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(reducedQuery).matches,
    () => true,
  );
}

type TooltipProps = { active?: boolean; payload?: { payload: DayPoint }[] };

/** Rich tooltip: the day's full breakdown, not just the plotted number. */
function DayTooltip({ active, payload, metric }: TooltipProps & { metric: Metric }) {
  const p = payload?.[0]?.payload;
  if (!active || !p) return null;
  const rows: [string, number][] = [
    ["Conversations", p.conversations],
    ["Messages", p.messages],
    ["Resolved", p.resolved],
    ["From your website", p.widget],
    ["From the playground", p.playground],
    ...(p.api > 0 ? ([["From the API", p.api]] as [string, number][]) : []),
  ];
  return (
    <div className="panel-raised min-w-48 px-3 py-2.5 text-[12.5px]">
      <p className="font-medium text-fg">{p.label}</p>
      <dl className="mt-1.5 space-y-1">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-6">
            <dt className={k.toLowerCase() === metric ? "font-medium text-fg" : "text-fg-muted"}>{k}</dt>
            <dd className="tabular font-medium text-fg">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** One count per day as bars that grow from the baseline. Lazy-loaded (Recharts stays out of the page bundle). */
export default function TrendChart({
  data,
  metric,
  height = 240,
}: {
  data: DayPoint[];
  metric: Metric;
  height?: number;
}) {
  const reduced = useReducedMotion();
  const interval = data.length > 60 ? 13 : data.length > 20 ? 4 : 0;
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barCategoryGap="22%">
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--fg-muted)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            interval={interval}
            minTickGap={12}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "var(--fg-muted)" }}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <Tooltip cursor={{ fill: "var(--sunken)" }} content={<DayTooltip metric={metric} />} isAnimationActive={false} />
          <Bar
            dataKey={metric}
            fill="var(--chart-1)"
            radius={[4, 4, 0, 0]}
            maxBarSize={22}
            minPointSize={0}
            isAnimationActive={!reduced}
            animationDuration={600}
            animationEasing="ease-out"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
