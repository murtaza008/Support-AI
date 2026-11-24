import { cn } from "@/lib/utils";

/** Tiny trend line; draws in from the left. Decorative: the number beside it carries the meaning. */
export function Sparkline({
  values,
  className,
  stroke = "var(--chart-1)",
  height = 28,
}: {
  values: number[];
  className?: string;
  stroke?: string;
  height?: number;
}) {
  const w = 100;
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? w / (values.length - 1) : w;
  const pts = values.map((v, i) => [i * step, height - 2 - (v / max) * (height - 4)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = `${line} L${w},${height} L0,${height} Z`;
  return (
    <svg
      viewBox={`0 0 ${w} ${height}`}
      preserveAspectRatio="none"
      aria-hidden
      className={cn("block w-full overflow-visible", className)}
      style={{ height }}
    >
      <path d={area} fill={stroke} opacity={0.08} />
      <path
        d={line}
        pathLength={1}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        strokeLinecap="round"
        className="draw-in"
      />
    </svg>
  );
}
