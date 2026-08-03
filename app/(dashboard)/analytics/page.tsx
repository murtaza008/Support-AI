"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import { BarChart3, MessageSquare, Bot, Sparkles } from "lucide-react";
import { useCurrentWorkspace } from "@/lib/hooks/use-current-workspace";
import { Reveal } from "@/components/motion/Reveal";

type AnalyticsData = {
  messages: { id: string; role: string; createdAt: string; conversationId: string }[];
  conversations: {
    id: string;
    assistantId: string;
    channel: string;
    createdAt: string;
    resolved: boolean;
    rating: number | null;
  }[];
  assistants: { id: string; name: string }[];
};

export default function AnalyticsPage() {
  const { data: ws } = useCurrentWorkspace();

  const { data, isLoading } = useQuery({
    queryKey: ["analytics", ws?.id],
    enabled: !!ws,
    queryFn: async (): Promise<AnalyticsData> => {
      const res = await fetch(`/api/analytics?workspaceId=${ws!.id}`);
      if (!res.ok) throw new Error("Failed to load analytics");
      return res.json();
    },
  });

  const days = Array.from({ length: 30 }, (_, i) => {
    const d = startOfDay(subDays(new Date(), 29 - i));
    return { d, key: format(d, "yyyy-MM-dd") };
  });

  const daily = days.map(({ d, key }) => {
    const dayMsgs = (data?.messages ?? []).filter(
      (m) => format(new Date(m.createdAt), "yyyy-MM-dd") === key,
    );
    return {
      date: format(d, "MMM d"),
      messages: dayMsgs.length,
      conversations: (data?.conversations ?? []).filter(
        (c) => format(new Date(c.createdAt), "yyyy-MM-dd") === key,
      ).length,
    };
  });

  const totalMsgs = data?.messages.length ?? 0;
  const totalConvs = data?.conversations.length ?? 0;
  const resolved = (data?.conversations ?? []).filter((c) => c.resolved).length;
  const resolutionRate = totalConvs > 0 ? Math.round((resolved / totalConvs) * 100) : null;
  const avgPerConv = totalConvs > 0 ? (totalMsgs / totalConvs).toFixed(1) : "—";

  const byAssistant = (data?.assistants ?? []).map((a) => ({
    name: a.name.length > 14 ? a.name.slice(0, 14) + "…" : a.name,
    convs: (data?.conversations ?? []).filter((c) => c.assistantId === a.id).length,
  }));

  const kpis = [
    { label: "Messages · 30d", value: totalMsgs, icon: MessageSquare },
    { label: "Conversations", value: totalConvs, icon: Sparkles },
    {
      label: "Resolution rate",
      value: resolutionRate !== null ? `${resolutionRate}%` : "—",
      icon: BarChart3,
    },
    { label: "Msgs / conv", value: avgPerConv, icon: Bot },
  ];

  return (
    <div className="max-w-6xl mx-auto px-8 py-10">
      <Reveal>
        <div className="font-mono-caps text-signal">Analytics</div>
        <h1
          className="mt-2 font-display text-4xl md:text-5xl font-semibold"
          style={{ letterSpacing: "-0.02em" }}
        >
          Last 30 days.
        </h1>
        <p className="mt-3 text-muted-foreground text-lg">
          Volume, resolution, and where your assistants are pulling weight.
        </p>
      </Reveal>

      <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <Reveal key={k.label} delay={0.05 * i} className="bg-paper-raised hairline rounded-lg p-5">
            <div className="flex items-center justify-between">
              <span className="font-mono-caps text-muted-foreground">{k.label}</span>
              <k.icon className="size-4 text-ink/40" />
            </div>
            <div className="mt-3 font-display text-3xl font-semibold text-ink tracking-tight">
              {isLoading ? "…" : k.value}
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.1} className="mt-10 bg-paper-raised hairline rounded-lg p-6">
        <div className="font-mono-caps text-muted-foreground">Volume</div>
        <h2 className="mt-1 font-display text-2xl font-semibold">Messages per day</h2>
        <div className="mt-6 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={daily} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="signal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF5A36" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#FF5A36" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                width={32}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--paper-raised)",
                  border: "1px solid var(--line)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="messages"
                stroke="#FF5A36"
                strokeWidth={2}
                fill="url(#signal)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Reveal>

      <Reveal delay={0.15} className="mt-6 bg-paper-raised hairline rounded-lg p-6">
        <div className="font-mono-caps text-muted-foreground">By assistant</div>
        <h2 className="mt-1 font-display text-2xl font-semibold">Conversations handled</h2>
        {byAssistant.length === 0 ? (
          <p className="mt-8 text-muted-foreground text-center py-10">No assistants yet.</p>
        ) : (
          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byAssistant} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,90,54,0.08)" }}
                  contentStyle={{
                    background: "var(--paper-raised)",
                    border: "1px solid var(--line)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="convs" fill="var(--ink)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Reveal>
    </div>
  );
}
