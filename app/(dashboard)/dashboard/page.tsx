"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Bot, MessageSquare, Zap } from "lucide-react";
import { useCurrentWorkspace } from "@/lib/hooks/use-current-workspace";
import { Reveal } from "@/components/motion/Reveal";

type Assistant = {
  id: string;
  name: string;
  tone: string;
  createdAt: string;
};

type AnalyticsSummary = {
  messages: { id: string }[];
  conversations: { id: string; resolved: boolean }[];
};

export default function DashboardPage() {
  const { data: ws } = useCurrentWorkspace();

  const { data: assistants } = useQuery({
    queryKey: ["assistants", ws?.id],
    queryFn: async (): Promise<Assistant[]> => {
      const res = await fetch(`/api/assistants?workspaceId=${ws!.id}`);
      if (!res.ok) throw new Error("Failed to load assistants");
      return res.json();
    },
    enabled: !!ws,
  });

  // Same query key as the Analytics page, so the two share one cached response.
  const { data: analytics } = useQuery({
    queryKey: ["analytics", ws?.id],
    queryFn: async (): Promise<AnalyticsSummary> => {
      const res = await fetch(`/api/analytics?workspaceId=${ws!.id}`);
      if (!res.ok) throw new Error("Failed to load analytics");
      return res.json();
    },
    enabled: !!ws,
  });

  const conversations = analytics?.conversations ?? [];
  const resolved = conversations.filter((c) => c.resolved).length;
  const kpis = [
    { label: "Assistants", value: assistants?.length ?? 0, icon: Bot },
    { label: "Messages · 30d", value: analytics?.messages.length ?? 0, icon: MessageSquare },
    {
      label: "Resolution rate",
      value: conversations.length > 0 ? `${Math.round((resolved / conversations.length) * 100)}%` : "—",
      icon: Zap,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-8 py-10">
      <Reveal>
        <div className="font-mono-caps text-signal">Overview</div>
        <h1
          className="mt-2 font-display text-4xl md:text-5xl font-semibold"
          style={{ letterSpacing: "-0.02em" }}
        >
          Welcome back.
        </h1>
        <p className="mt-3 text-muted-foreground text-lg">
          Here&rsquo;s what&rsquo;s happening across{" "}
          <span className="text-ink font-medium">{ws?.name}</span>.
        </p>
      </Reveal>

      <div className="mt-10 grid md:grid-cols-3 gap-4">
        {kpis.map((k, i) => (
          <Reveal key={k.label} delay={0.05 * i} className="bg-paper-raised hairline rounded-lg p-5">
            <div className="flex items-center justify-between">
              <span className="font-mono-caps text-muted-foreground">{k.label}</span>
              <k.icon className="size-4 text-ink/40" />
            </div>
            <div className="mt-3 font-display text-4xl font-semibold text-ink tracking-tight">
              {k.value}
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.1} className="mt-10 bg-paper-raised hairline rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono-caps text-muted-foreground">Assistants</div>
            <h2 className="mt-1 font-display text-2xl font-semibold">Your agents</h2>
          </div>
          <Link
            href="/assistants"
            className="inline-flex items-center gap-1.5 text-sm text-signal font-medium hover:underline"
          >
            Manage all <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
        <div className="mt-5 divide-y divide-line">
          {(assistants ?? []).slice(0, 5).map((a) => (
            <div key={a.id} className="py-3 flex items-center justify-between">
              <div>
                <div className="text-ink font-medium">{a.name}</div>
                <div className="font-mono text-[11px] text-muted-foreground uppercase mt-0.5">
                  {a.tone} · created {new Date(a.createdAt).toLocaleDateString()}
                </div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-moss-dim text-moss">
                live
              </span>
            </div>
          ))}
          {(assistants ?? []).length === 0 && (
            <div className="py-10 text-center">
              <p className="text-muted-foreground">No assistants yet.</p>
              <Link
                href="/assistants"
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-ink text-paper rounded-md text-sm hover:bg-signal transition-colors"
              >
                Create your first assistant →
              </Link>
            </div>
          )}
        </div>
      </Reveal>
    </div>
  );
}
