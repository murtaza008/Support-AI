"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { formatDistanceToNowStrict } from "date-fns";
import { BookOpen, MessagesSquare } from "lucide-react";
import { useCurrentWorkspace } from "@/lib/hooks/use-current-workspace";
import { q } from "@/lib/queries";
import { byAssistant, byChannel, dailySeries, formatChange, hourHeatmap, kpis } from "@/lib/analytics-view";
import { Kpi } from "@/components/data/Kpi";
import { Delta } from "@/components/data/Delta";
import { BarList } from "@/components/data/BarList";
import { Heatmap } from "@/components/data/Heatmap";
import { HoverStats } from "@/components/ui/hover-card";
import { EmptyState, PageHeader, Panel, PanelHeader, Skeleton, staggerStyle } from "@/components/ui/primitives";
import { Segmented } from "@/components/ui/segmented";

const TrendChart = dynamic(() => import("@/components/data/TrendChart"), {
  ssr: false,
  loading: () => <Skeleton className="h-[280px] w-full rounded-md" />,
});

type Range = 7 | 30 | 90;
const channelColor = { WIDGET: "var(--chart-1)", PLAYGROUND: "var(--chart-3)", API: "var(--chart-4)" } as const;

export default function AnalyticsPage() {
  const { data: ws } = useCurrentWorkspace();
  const [days, setDays] = useState<Range>(30);
  const [metric, setMetric] = useState<"conversations" | "messages">("conversations");
  const [now] = useState(() => new Date());

  const { data, isLoading, isFetching } = useQuery({
    ...q.analytics(ws?.id ?? "", days),
    enabled: !!ws,
    placeholderData: keepPreviousData,
  });

  const series = useMemo(() => (data ? dailySeries(data, now) : []), [data, now]);
  const k = useMemo(() => (data ? kpis(data) : null), [data]);
  const channels = useMemo(() => (data ? byChannel(data) : []), [data]);
  const assistants = useMemo(() => (data ? byAssistant(data, series) : []), [data, series]);
  const grid = useMemo(() => (data ? hourHeatmap(data) : []), [data]);
  const shownDays = data?.days ?? days;
  const vs = `vs previous ${shownDays} days`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <PageHeader
        eyebrow="Analytics"
        title="How your assistants are doing"
        description="Volume, resolution and the questions your docs don’t cover yet."
        actions={
          <Segmented
            label="Date range"
            value={String(days) as "7" | "30" | "90"}
            onChange={(v) => setDays(Number(v) as Range)}
            options={[
              { value: "7", label: "7 days" },
              { value: "30", label: "30 days" },
              { value: "90", label: "90 days" },
            ]}
          />
        }
      />

      <div aria-busy={isFetching} className={isFetching && !isLoading ? "opacity-70 transition-opacity" : "transition-opacity"}>
        <section aria-label={`Last ${shownDays} days`} className="stagger mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4 [&>div]:h-full">
          <div style={staggerStyle(0)}>
            <Kpi
              label="Conversations"
              value={k?.conversations.value ?? 0}
              loading={isLoading}
              delta={k && <Delta value={k.conversations.change} />}
              deltaLabel={k?.conversations.change === null ? undefined : vs}
              breakdown={
                data && (
                  <HoverStats
                    rows={[
                      ...channels.map((c) => ({ label: c.label, value: c.count })),
                      { label: `Previous ${shownDays} days`, value: data.previous.conversations },
                    ]}
                  />
                )
              }
            />
          </div>
          <div style={staggerStyle(1)}>
            <Kpi
              label="Messages"
              value={k?.messages.value ?? 0}
              loading={isLoading}
              delta={k && <Delta value={k.messages.change} />}
              deltaLabel={k?.messages.change === null ? undefined : vs}
              breakdown={
                data && (
                  <HoverStats
                    rows={[
                      { label: "From customers", value: data.messages.filter((m) => m.role === "USER").length },
                      { label: "Answers", value: data.messages.filter((m) => m.role === "ASSISTANT").length },
                      { label: `Previous ${shownDays} days`, value: data.previous.messages },
                    ]}
                  />
                )
              }
            />
          </div>
          <div style={staggerStyle(2)}>
            <Kpi
              label="Resolution rate"
              value={k?.resolution.value ?? null}
              suffix="%"
              loading={isLoading}
              delta={k && <Delta value={k.resolution.changePts} unit=" pts" good="up" />}
              deltaLabel={k?.resolution.changePts === null ? undefined : vs}
              breakdown={
                data &&
                k && (
                  <HoverStats
                    rows={[
                      { label: "Resolved", value: data.conversations.filter((c) => c.resolved).length },
                      { label: "Not resolved", value: data.conversations.filter((c) => !c.resolved).length },
                      { label: `Previous ${shownDays} days`, value: k.resolution.previous === null ? "—" : `${k.resolution.previous}%` },
                    ]}
                  />
                )
              }
            />
          </div>
          <div style={staggerStyle(3)}>
            <Kpi
              label="Messages per conversation"
              value={k?.perConversation.value ?? null}
              format={(n) => n.toFixed(1)}
              loading={isLoading}
              deltaLabel="Average back-and-forth"
              breakdown={
                data && (
                  <HoverStats
                    rows={[
                      { label: "Conversations", value: data.conversations.length },
                      { label: "Messages", value: data.messages.length },
                      { label: "Answers with sources", value: k?.cited.value === null || !k ? "—" : `${k.cited.value}%` },
                    ]}
                  />
                )
              }
            />
          </div>
        </section>

        <Panel className="mt-4">
          <PanelHeader
              title={`${metric === "conversations" ? "Conversations" : "Messages"} per day`}
              description={k ? formatChange(metric === "conversations" ? k.conversations.change : k.messages.change, shownDays) : " "}
              action={
                <Segmented
                  label="Metric"
                  value={metric}
                  onChange={setMetric}
                  options={[
                    { value: "conversations", label: "Conversations" },
                    { value: "messages", label: "Messages" },
                  ]}
                />
              }
            />
          <div className="px-3 pb-3 pt-2">
            {isLoading ? (
              <Skeleton className="h-[280px] w-full rounded-md" />
            ) : (
              <TrendChart data={series} metric={metric} height={280} />
            )}
          </div>
          {data && (
            <details className="border-t border-border px-5 py-3 text-[13px]">
              <summary className="cursor-pointer text-fg-muted hover:text-fg">Show as table</summary>
              <div className="mt-2 max-h-72 overflow-auto scrollbar-thin" tabIndex={0} aria-label="Daily numbers">
                <table className="w-full text-left text-[12.5px]">
                  <caption className="sr-only">Conversations and messages per day</caption>
                  <thead>
                    <tr className="text-fg-muted">
                      <th scope="col" className="py-1 pr-4 font-medium">Day</th>
                      <th scope="col" className="py-1 pr-4 text-right font-medium">Conversations</th>
                      <th scope="col" className="py-1 pr-4 text-right font-medium">Messages</th>
                      <th scope="col" className="py-1 text-right font-medium">Resolved</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...series].reverse().map((p) => (
                      <tr key={p.key} className="border-t border-border">
                        <th scope="row" className="py-1 pr-4 font-medium text-fg">{p.label}</th>
                        <td className="py-1 pr-4 text-right tabular text-fg">{p.conversations}</td>
                        <td className="py-1 pr-4 text-right tabular text-fg">{p.messages}</td>
                        <td className="py-1 text-right tabular text-fg">{p.resolved}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
        </Panel>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Panel>
            <PanelHeader title="Where conversations start" description="By channel" />
            <div className="px-5 pb-5 pt-4">
              {isLoading ? (
                <Skeleton className="h-24" />
              ) : (
                <BarList
                  label="Conversations by channel"
                  items={channels.map((c) => {
                    const total = data?.conversations.length ?? 0;
                    return {
                      key: c.channel,
                      label: (
                        <span className="inline-flex items-center gap-2">
                          <span aria-hidden className="size-2.5 rounded-sm" style={{ background: channelColor[c.channel] }} />
                          {c.label}
                        </span>
                      ),
                      value: c.count,
                      color: channelColor[c.channel],
                      display: total ? `${c.count} · ${Math.round((c.count / total) * 100)}%` : "0",
                    };
                  })}
                />
              )}
            </div>
          </Panel>
          <Panel>
            <PanelHeader title="By assistant" description="Conversations handled and resolution rate" />
            <div className="px-5 pb-5 pt-4">
              {isLoading ? (
                <Skeleton className="h-24" />
              ) : assistants.length === 0 ? (
                <EmptyState title="No assistants yet" description="Create an assistant to see how it performs here." className="py-6" />
              ) : (
                <BarList
                  label="Conversations by assistant"
                  items={assistants.map((a) => ({
                    key: a.id,
                    label: a.name,
                    value: a.conversations,
                    display: `${a.conversations} · ${a.conversations ? Math.round((a.resolved / a.conversations) * 100) : 0}% resolved`,
                  }))}
                />
              )}
            </div>
          </Panel>
        </div>

        <Panel className="mt-4">
          <PanelHeader title="When customers ask" description="Customer messages by weekday and hour, in your time zone" />
          <div className="px-5 pb-5 pt-3">{isLoading ? <Skeleton className="h-40" /> : <Heatmap grid={grid} />}</div>
        </Panel>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Panel>
            <PanelHeader title="Most cited documents" description="How many answers used each one" />
            <div className="px-5 pb-5 pt-4">
              {isLoading ? (
                <Skeleton className="h-28" />
              ) : !data?.topDocuments.length ? (
                <EmptyState
                  icon={<BookOpen />}
                  title="No citations yet"
                  description="When assistants answer from your documents, the most used ones appear here."
                  className="py-6"
                />
              ) : (
                <BarList
                  label="Most cited documents"
                  items={data.topDocuments.map((d) => ({
                    key: d.id,
                    label: d.name,
                    value: d.answers,
                    display: `${d.answers} ${d.answers === 1 ? "answer" : "answers"}`,
                  }))}
                />
              )}
            </div>
          </Panel>
          <Panel>
            <PanelHeader title="Not covered by your docs" description="Answers that found no matching passage" />
            <div className="px-2 pb-3 pt-2">
              {isLoading ? (
                <Skeleton className="mx-3 h-28" />
              ) : !data?.gaps.length ? (
                <EmptyState
                  icon={<MessagesSquare />}
                  title="No gaps found"
                  description={`Every answer in the last ${shownDays} days cited at least one document.`}
                  className="py-6"
                />
              ) : (
                <ul className="stagger">
                  {data.gaps.map((g, i) => (
                    <li key={g.conversationId} style={staggerStyle(i)}>
                      <Link
                        href={`/conversations?c=${g.conversationId}`}
                        className="block rounded-md px-3 py-2.5 transition-colors hover:bg-sunken"
                      >
                        <span className="block text-[13.5px] text-fg">&ldquo;{g.question}&rdquo;</span>
                        <span className="mt-0.5 block text-[12px] text-fg-muted">
                          {assistants.find((a) => a.id === g.assistantId)?.name ?? "Assistant"} ·{" "}
                          {formatDistanceToNowStrict(new Date(g.at), { addSuffix: true })}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
