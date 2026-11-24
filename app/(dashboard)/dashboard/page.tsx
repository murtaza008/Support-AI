"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNowStrict } from "date-fns";
import { AlertTriangle, ArrowUpRight, BookOpen, Bot, Globe, MessagesSquare, PlayCircle, Upload } from "lucide-react";
import { useCurrentWorkspace } from "@/lib/hooks/use-current-workspace";
import { q, type ConversationRow } from "@/lib/queries";
import { byAssistant, byChannel, dailySeries, formatChange, kpis } from "@/lib/analytics-view";
import { Kpi } from "@/components/data/Kpi";
import { Delta } from "@/components/data/Delta";
import { BarList } from "@/components/data/BarList";
import { Sparkline } from "@/components/data/Sparkline";
import { HoverCard, HoverStats } from "@/components/ui/hover-card";
import { Badge, EmptyState, PageHeader, Panel, PanelHeader, Skeleton, staggerStyle } from "@/components/ui/primitives";
import { Segmented } from "@/components/ui/segmented";
import { buttonVariants } from "@/components/ui/button";

const TrendChart = dynamic(() => import("@/components/data/TrendChart"), {
  ssr: false,
  loading: () => <Skeleton className="h-[240px] w-full rounded-md" />,
});

const DAYS = 30;
const channelLabel = { WIDGET: "Website", PLAYGROUND: "Playground", API: "API" } as const;

function greeting(hour: number) {
  if (hour < 5) return "Good evening";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { data: ws } = useCurrentWorkspace();
  const { data: session } = useSession();
  const [now] = useState(() => new Date());
  const [metric, setMetric] = useState<"conversations" | "messages">("conversations");

  const wsId = ws?.id ?? "";
  const analytics = useQuery({ ...q.analytics(wsId, DAYS), enabled: !!ws });
  const summary = useQuery({ ...q.summary(wsId), enabled: !!ws });
  const conversations = useQuery({ ...q.conversations(wsId), enabled: !!ws });
  const assistants = useQuery({ ...q.assistants(wsId), enabled: !!ws });

  const data = analytics.data;
  const series = useMemo(() => (data ? dailySeries(data, now) : []), [data, now]);
  const k = useMemo(() => (data ? kpis(data) : null), [data]);
  const perAssistant = useMemo(() => (data ? byAssistant(data, series) : []), [data, series]);
  const channels = useMemo(() => (data ? byChannel(data) : []), [data]);
  const open = useMemo(
    () => (conversations.data ?? []).filter((c) => !c.resolved).slice(0, 5),
    [conversations.data],
  );

  const name = session?.user?.name?.split(" ")[0] ?? session?.user?.email?.split("@")[0] ?? "";
  const loading = analytics.isLoading;
  const s = summary.data;
  const firstAssistant = assistants.data?.[0];

  const headline = s
    ? `${s.conversations.today} ${s.conversations.today === 1 ? "conversation" : "conversations"} today` +
      (s.conversations.open30d > 0 ? ` · ${s.conversations.open30d} not resolved in the last 30 days` : " · nothing waiting") +
      (s.documents.error > 0 ? ` · ${s.documents.error} ${s.documents.error === 1 ? "document" : "documents"} failed to index` : "")
    : "Loading today’s numbers…";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <PageHeader
        eyebrow={now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        title={`${greeting(now.getHours())}${name ? `, ${name}` : ""}.`}
        description={headline}
        actions={
          <>
            {firstAssistant && (
              <Link
                href={`/assistants/${firstAssistant.id}/playground`}
                data-press=""
                className={buttonVariants({ variant: "secondary" })}
              >
                <PlayCircle /> Open playground
              </Link>
            )}
            <Link href="/knowledge" data-press="" className={buttonVariants({ variant: "primary" })}>
              <Upload /> Add documents
            </Link>
          </>
        }
      />

      {/* KPIs */}
      <section aria-label="Last 30 days" className="stagger mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4 [&>div]:h-full">
        <div style={staggerStyle(0)}>
          <Kpi
            label="Conversations"
            value={k?.conversations.value ?? 0}
            loading={loading}
            delta={k && <Delta value={k.conversations.change} />}
            deltaLabel={k?.conversations.change === null ? undefined : "vs previous 30 days"}
            spark={series.map((p) => p.conversations)}
            breakdown={
              data && (
                <HoverStats
                  rows={[
                    ...channels.map((c) => ({ label: c.label, value: c.count })),
                    { label: "Previous 30 days", value: data.previous.conversations },
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
            loading={loading}
            delta={k && <Delta value={k.messages.change} />}
            deltaLabel={k?.messages.change === null ? undefined : "vs previous 30 days"}
            spark={series.map((p) => p.messages)}
            breakdown={
              data &&
              k && (
                <HoverStats
                  rows={[
                    { label: "From customers", value: data.messages.filter((m) => m.role === "USER").length },
                    { label: "Answers", value: data.messages.filter((m) => m.role === "ASSISTANT").length },
                    { label: "Per conversation", value: k.perConversation.value ?? "—" },
                    { label: "Previous 30 days", value: data.previous.messages },
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
            loading={loading}
            delta={k && <Delta value={k.resolution.changePts} unit=" pts" good="up" />}
            deltaLabel={k?.resolution.changePts === null ? undefined : "vs previous 30 days"}
            spark={series.map((p) => (p.conversations ? Math.round((p.resolved / p.conversations) * 100) : 0))}
            breakdown={
              data && (
                <HoverStats
                  rows={[
                    { label: "Resolved", value: data.conversations.filter((c) => c.resolved).length },
                    { label: "Not resolved", value: data.conversations.filter((c) => !c.resolved).length },
                    {
                      label: "Previous 30 days",
                      value: k?.resolution.previous !== null && k ? `${k.resolution.previous}%` : "—",
                    },
                  ]}
                />
              )
            }
          />
        </div>
        <div style={staggerStyle(3)}>
          <Kpi
            label="Answers with sources"
            value={k?.cited.value ?? null}
            suffix="%"
            loading={loading}
            deltaLabel={data ? `${data.answers.cited} of ${data.answers.total} answers cited a document` : undefined}
            breakdown={
              data && (
                <>
                  <HoverStats
                    rows={[
                      { label: "Cited a document", value: data.answers.cited },
                      { label: "No source found", value: data.answers.total - data.answers.cited },
                    ]}
                  />
                  <p className="mt-3 text-[12.5px] text-fg-muted">
                    An answer with no source usually means the docs don&rsquo;t cover the question. See the list below.
                  </p>
                </>
              )
            }
          />
        </div>
      </section>

      {/* Trend + needs attention */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader
              title="Volume, last 30 days"
              description={k ? formatChange(metric === "conversations" ? k.conversations.change : k.messages.change, DAYS) : " "}
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
            {loading ? <Skeleton className="h-[240px] w-full rounded-md" /> : <TrendChart data={series} metric={metric} />}
          </div>
        </Panel>

        <Panel className="flex flex-col">
          <PanelHeader
            title="Needs attention"
            description="Open conversations and documents that failed"
            action={
              <Link href="/conversations" className="text-[13px] font-medium text-accent-text hover:underline">
                View all
              </Link>
            }
          />
          <div className="flex-1 px-2 pb-3 pt-2">
            {conversations.isLoading ? (
              <div className="space-y-2 px-3">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : open.length === 0 && !(s && s.documents.error > 0) ? (
              <EmptyState
                icon={<MessagesSquare />}
                title="Nothing waiting"
                description="Every recent conversation is resolved and every document is indexed."
                className="py-8"
              />
            ) : (
              <ul className="stagger">
                {s && s.documents.error > 0 && (
                  <li style={staggerStyle(0)}>
                    <Link
                      href="/knowledge"
                      className="flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-sunken"
                    >
                      <AlertTriangle aria-hidden className="size-4 shrink-0 text-danger-text" />
                      <span className="min-w-0 flex-1 text-[13.5px] text-fg">
                        {s.documents.error} {s.documents.error === 1 ? "document" : "documents"} failed to index
                      </span>
                      <ArrowUpRight aria-hidden className="size-4 text-fg-subtle" />
                    </Link>
                  </li>
                )}
                {open.map((c, i) => (
                  <li key={c.id} style={staggerStyle(i + 1)}>
                    <OpenConversation c={c} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Panel>
      </div>

      {/* Assistants + top documents */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader
            title="Assistants"
            description="Conversations and resolution over the last 30 days"
            action={
              <Link href="/assistants" className="text-[13px] font-medium text-accent-text hover:underline">
                Manage
              </Link>
            }
          />
          <div className="px-2 pb-3 pt-2">
            {loading ? (
              <div className="space-y-2 px-3">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            ) : perAssistant.length === 0 ? (
              <EmptyState
                icon={<Bot />}
                title="No assistants yet"
                description="An assistant answers questions from your documents. Create one to start testing."
                action={
                  <Link href="/assistants" className={buttonVariants({ variant: "primary", size: "sm" })}>
                    Create an assistant
                  </Link>
                }
                className="py-8"
              />
            ) : (
              <table className="w-full text-[13.5px]">
                <caption className="sr-only">Assistants, last 30 days</caption>
                <thead>
                  <tr className="text-left text-[12px] text-fg-muted">
                    <th scope="col" className="px-3 pb-2 font-medium">
                      Assistant
                    </th>
                    <th scope="col" className="hidden px-3 pb-2 font-medium sm:table-cell">
                      Trend
                    </th>
                    <th scope="col" className="px-3 pb-2 text-right font-medium">
                      Conversations
                    </th>
                    <th scope="col" className="px-3 pb-2 text-right font-medium">
                      Resolved
                    </th>
                  </tr>
                </thead>
                <tbody className="stagger">
                  {perAssistant.map((a, i) => {
                    const rate = a.conversations ? Math.round((a.resolved / a.conversations) * 100) : null;
                    return (
                      <tr key={a.id} style={staggerStyle(i)} className="border-t border-border">
                        <td className="px-3 py-2.5">
                          <HoverCard
                            delay="long"
                            trigger={
                              <Link
                                href={`/assistants/${a.id}/playground`}
                                className="font-medium text-fg underline-offset-4 hover:underline"
                              >
                                {a.name}
                              </Link>
                            }
                          >
                            <p className="font-medium">{a.name}</p>
                            <HoverStats
                              rows={[
                                { label: "Conversations", value: a.conversations },
                                { label: "From your website", value: a.widget },
                                { label: "Messages", value: a.messages },
                                {
                                  label: "Last conversation",
                                  value: a.lastAt
                                    ? formatDistanceToNowStrict(new Date(a.lastAt), { addSuffix: true })
                                    : "None yet",
                                },
                              ]}
                            />
                            <p className="mt-3 text-[12.5px] text-fg-muted">Opens the playground.</p>
                          </HoverCard>
                        </td>
                        <td className="hidden w-40 px-3 py-2.5 sm:table-cell">
                          <Sparkline values={a.daily} height={22} />
                        </td>
                        <td className="px-3 py-2.5 text-right tabular text-fg">{a.conversations}</td>
                        <td className="px-3 py-2.5 text-right tabular text-fg">{rate === null ? "—" : `${rate}%`}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Most cited documents" description="How many answers used each one" />
          <div className="px-5 pb-5 pt-4">
            {loading ? (
              <Skeleton className="h-32" />
            ) : !data || data.topDocuments.length === 0 ? (
              <EmptyState
                icon={<BookOpen />}
                title="No citations yet"
                description="Once assistants answer from your documents, the most used ones show up here."
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
      </div>

      {/* Gaps */}
      <Panel className="mt-4">
        <PanelHeader
          title="Questions your docs didn’t answer"
          description="The assistant found no matching passage. Adding a document on these topics closes the gap."
        />
        <div className="px-2 pb-3 pt-2">
          {loading ? (
            <Skeleton className="mx-3 h-20" />
          ) : !data || data.gaps.length === 0 ? (
            <EmptyState
              icon={<BookOpen />}
              title="No gaps found"
              description="Every answer in the last 30 days cited at least one document."
              className="py-6"
            />
          ) : (
            <ul className="stagger grid gap-1 md:grid-cols-2">
              {data.gaps.map((g, i) => (
                <li key={g.conversationId} style={staggerStyle(i)}>
                  <Link
                    href={`/conversations?c=${g.conversationId}`}
                    className="flex items-start gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-sunken"
                  >
                    <MessagesSquare aria-hidden className="mt-0.5 size-4 shrink-0 text-fg-subtle" />
                    <span className="min-w-0">
                      <span className="block text-[13.5px] text-fg">&ldquo;{g.question}&rdquo;</span>
                      <span className="mt-0.5 block text-[12px] text-fg-muted">
                        {perAssistant.find((a) => a.id === g.assistantId)?.name ?? "Assistant"} ·{" "}
                        {formatDistanceToNowStrict(new Date(g.at), { addSuffix: true })}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>
    </div>
  );
}

function OpenConversation({ c }: { c: ConversationRow }) {
  const Icon = c.channel === "WIDGET" ? Globe : PlayCircle;
  return (
    <HoverCard
      delay="long"
      side="left"
      trigger={
        <Link
          href={`/conversations?c=${c.id}`}
          className="flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-sunken"
        >
          <Icon aria-hidden className="size-4 shrink-0 text-fg-subtle" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13.5px] text-fg">{c.assistant?.name ?? "Assistant"}</span>
            <span className="block text-[12px] text-fg-muted">
              {channelLabel[c.channel]} · {formatDistanceToNowStrict(new Date(c.createdAt), { addSuffix: true })}
            </span>
          </span>
          <Badge tone="warning">Open</Badge>
        </Link>
      }
    >
      <p className="font-medium">{c.assistant?.name ?? "Assistant"}</p>
      <HoverStats
        rows={[
          { label: "Channel", value: channelLabel[c.channel] },
          { label: "Started", value: new Date(c.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) },
          { label: "Last activity", value: formatDistanceToNowStrict(new Date(c.updatedAt), { addSuffix: true }) },
          { label: "Visitor", value: c.visitorId ? c.visitorId.slice(0, 8) : "Your team" },
          { label: "Rating", value: c.rating ?? "Not rated" },
        ]}
      />
      <p className="mt-3 text-[12.5px] text-fg-muted">Opens the full transcript.</p>
    </HoverCard>
  );
}
