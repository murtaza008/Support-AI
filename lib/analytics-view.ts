import type { AnalyticsResponse } from "@/lib/queries";
import { percentChange } from "@/lib/analytics";

/** Turns the analytics response into what the screens draw. Pure, unit tested. */

export type DayPoint = {
  key: string;
  label: string;
  conversations: number;
  messages: number;
  resolved: number;
  widget: number;
  playground: number;
  api: number;
};

const DAY = 24 * 60 * 60 * 1000;

function dayKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** One point per local day, oldest first, including empty days. */
export function dailySeries(data: AnalyticsResponse, now = new Date()): DayPoint[] {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const points: DayPoint[] = [];
  const index = new Map<string, DayPoint>();
  for (let i = data.days - 1; i >= 0; i--) {
    const d = new Date(start.getTime() - i * DAY);
    const p: DayPoint = {
      key: dayKey(d),
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      conversations: 0,
      messages: 0,
      resolved: 0,
      widget: 0,
      playground: 0,
      api: 0,
    };
    points.push(p);
    index.set(p.key, p);
  }
  for (const c of data.conversations) {
    const p = index.get(dayKey(new Date(c.createdAt)));
    if (!p) continue;
    p.conversations += 1;
    if (c.resolved) p.resolved += 1;
    if (c.channel === "WIDGET") p.widget += 1;
    else if (c.channel === "API") p.api += 1;
    else p.playground += 1;
  }
  for (const m of data.messages) {
    const p = index.get(dayKey(new Date(m.createdAt)));
    if (p) p.messages += 1;
  }
  return points;
}

export type Kpis = {
  conversations: { value: number; change: number | null };
  messages: { value: number; change: number | null };
  resolution: { value: number | null; previous: number | null; changePts: number | null };
  perConversation: { value: number | null };
  widgetShare: { value: number | null; widget: number };
  cited: { value: number | null };
};

export function kpis(data: AnalyticsResponse): Kpis {
  const convs = data.conversations.length;
  const msgs = data.messages.length;
  const resolved = data.conversations.filter((c) => c.resolved).length;
  const widget = data.conversations.filter((c) => c.channel === "WIDGET").length;
  const resolution = convs > 0 ? Math.round((resolved / convs) * 100) : null;
  const prevResolution =
    data.previous.conversations > 0 ? Math.round((data.previous.resolved / data.previous.conversations) * 100) : null;
  return {
    conversations: { value: convs, change: percentChange(convs, data.previous.conversations) },
    messages: { value: msgs, change: percentChange(msgs, data.previous.messages) },
    resolution: {
      value: resolution,
      previous: prevResolution,
      changePts: resolution !== null && prevResolution !== null ? resolution - prevResolution : null,
    },
    perConversation: { value: convs > 0 ? Math.round((msgs / convs) * 10) / 10 : null },
    widgetShare: { value: convs > 0 ? Math.round((widget / convs) * 100) : null, widget },
    cited: { value: data.answers.total > 0 ? Math.round((data.answers.cited / data.answers.total) * 100) : null },
  };
}

export type AssistantStat = {
  id: string;
  name: string;
  conversations: number;
  resolved: number;
  widget: number;
  messages: number;
  lastAt: string | null;
  daily: number[];
};

export function byAssistant(data: AnalyticsResponse, series: DayPoint[]): AssistantStat[] {
  const keyIndex = new Map(series.map((p, i) => [p.key, i]));
  const convAssistant = new Map(data.conversations.map((c) => [c.id, c.assistantId]));
  const stats = new Map<string, AssistantStat>(
    data.assistants.map((a) => [
      a.id,
      { id: a.id, name: a.name, conversations: 0, resolved: 0, widget: 0, messages: 0, lastAt: null, daily: series.map(() => 0) },
    ]),
  );
  for (const c of data.conversations) {
    const s = stats.get(c.assistantId);
    if (!s) continue;
    s.conversations += 1;
    if (c.resolved) s.resolved += 1;
    if (c.channel === "WIDGET") s.widget += 1;
    if (!s.lastAt || c.createdAt > s.lastAt) s.lastAt = c.createdAt;
    const i = keyIndex.get(dayKey(new Date(c.createdAt)));
    if (i !== undefined) s.daily[i] += 1;
  }
  for (const m of data.messages) {
    const a = convAssistant.get(m.conversationId);
    const s = a ? stats.get(a) : undefined;
    if (s) s.messages += 1;
  }
  return [...stats.values()].sort((a, b) => b.conversations - a.conversations || a.name.localeCompare(b.name));
}

export type ChannelStat = { channel: "WIDGET" | "PLAYGROUND" | "API"; label: string; count: number };

export function byChannel(data: AnalyticsResponse): ChannelStat[] {
  const count = (ch: string) => data.conversations.filter((c) => c.channel === ch).length;
  return [
    { channel: "WIDGET" as const, label: "Website widget", count: count("WIDGET") },
    { channel: "PLAYGROUND" as const, label: "Playground", count: count("PLAYGROUND") },
    { channel: "API" as const, label: "API", count: count("API") },
  ].filter((c) => c.count > 0 || c.channel !== "API");
}

/** Customer messages by weekday (rows, Monday first) and hour (columns), local time. */
export function hourHeatmap(data: AnalyticsResponse): number[][] {
  const grid = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
  for (const m of data.messages) {
    if (m.role !== "USER") continue;
    const d = new Date(m.createdAt);
    grid[(d.getDay() + 6) % 7][d.getHours()] += 1;
  }
  return grid;
}

export function busiest(grid: number[][]): { day: number; hour: number; count: number } | null {
  let best: { day: number; hour: number; count: number } | null = null;
  grid.forEach((row, day) =>
    row.forEach((count, hour) => {
      if (count > 0 && (!best || count > best.count)) best = { day, hour, count };
    }),
  );
  return best;
}

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function hourLabel(h: number) {
  const suffix = h < 12 ? "am" : "pm";
  const n = h % 12 === 0 ? 12 : h % 12;
  return `${n}${suffix}`;
}

export function formatChange(change: number | null, period: number) {
  if (change === null) return `No data for the previous ${period} days`;
  if (change === 0) return `Same as the previous ${period} days`;
  return `${change > 0 ? "+" : ""}${change}% vs previous ${period} days`;
}
