"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNowStrict } from "date-fns";
import { ArrowLeft, Bot, FileText, Globe, MessagesSquare, PlayCircle, Search, Webhook } from "lucide-react";
import { useCurrentWorkspace } from "@/lib/hooks/use-current-workspace";
import { q, type ConversationRow } from "@/lib/queries";
import { segments } from "@/lib/citations";
import { DocumentViewer } from "@/components/dashboard/DocumentViewer";
import { HoverCard, HoverStats } from "@/components/ui/hover-card";
import { Badge, EmptyState, PageHeader, Panel, Skeleton, staggerStyle } from "@/components/ui/primitives";
import { Input, Select } from "@/components/ui/form";
import { Segmented } from "@/components/ui/segmented";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Citation = { documentId: string; documentName: string; similarity?: number };
type MessageRow = {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  citations: Citation[] | null;
  createdAt: string;
};

const channelIcon = { WIDGET: Globe, PLAYGROUND: PlayCircle, API: Webhook } as const;
const channelLabel = { WIDGET: "Website", PLAYGROUND: "Playground", API: "API" } as const;

export default function ConversationsPage() {
  return (
    <Suspense>
      <Conversations />
    </Suspense>
  );
}

function Conversations() {
  const router = useRouter();
  const params = useSearchParams();
  const selectedId = params.get("c");
  const { data: ws } = useCurrentWorkspace();
  const [status, setStatus] = useState<"all" | "open" | "resolved">("all");
  const [channel, setChannel] = useState<"ALL" | ConversationRow["channel"]>("ALL");
  const [query, setQuery] = useState("");
  const [viewing, setViewing] = useState<Citation | null>(null);

  const { data: convos, isLoading } = useQuery({ ...q.conversations(ws?.id ?? ""), enabled: !!ws });
  const { data: messages, isLoading: loadingMessages } = useQuery({
    queryKey: ["messages", selectedId],
    queryFn: async (): Promise<MessageRow[]> => {
      const res = await fetch(`/api/conversations/${selectedId}/messages`);
      if (!res.ok) throw new Error("Failed to load messages");
      return res.json();
    },
    enabled: !!selectedId,
  });

  const select = (id: string | null) => router.replace(id ? `/conversations?c=${id}` : "/conversations", { scroll: false });

  const counts = useMemo(() => {
    const all = convos ?? [];
    return { all: all.length, open: all.filter((c) => !c.resolved).length, resolved: all.filter((c) => c.resolved).length };
  }, [convos]);

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (convos ?? []).filter((c) => {
      if (status === "open" && c.resolved) return false;
      if (status === "resolved" && !c.resolved) return false;
      if (channel !== "ALL" && c.channel !== channel) return false;
      return (
        !needle ||
        (c.assistant?.name ?? "").toLowerCase().includes(needle) ||
        (c.visitorId ?? "").toLowerCase().includes(needle)
      );
    });
  }, [convos, status, channel, query]);

  const selected = (convos ?? []).find((c) => c.id === selectedId) ?? null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
      <PageHeader
        eyebrow="Conversations"
        title="Every chat, with the sources behind each answer"
        description={convos ? `${counts.all} most recent conversations · ${counts.open} not resolved` : "Loading conversations…"}
      />

      <div className="mt-6 grid gap-4 lg:h-[calc(100dvh-15rem-var(--banner-h,0px))] lg:min-h-[480px] lg:grid-cols-[360px_minmax(0,1fr)]">
        {/* List */}
        <Panel className={cn("flex min-h-0 flex-col overflow-hidden", selectedId && "hidden lg:flex")}>
          <div className="space-y-2 border-b border-border p-3">
            <div className="relative">
              <Search aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
              <Input
                type="search"
                aria-label="Search conversations"
                placeholder="Search assistant or visitor"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex items-center gap-2">
              <Segmented
                label="Filter by status"
                value={status}
                onChange={setStatus}
                options={[
                  { value: "all", label: "All" },
                  { value: "open", label: `Open ${counts.open}` },
                  { value: "resolved", label: "Resolved" },
                ]}
              />
              <Select
                aria-label="Filter by channel"
                value={channel}
                onChange={(e) => setChannel(e.target.value as typeof channel)}
                className="flex-1"
              >
                <option value="ALL">All channels</option>
                <option value="WIDGET">Website</option>
                <option value="PLAYGROUND">Playground</option>
                <option value="API">API</option>
              </Select>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
            {isLoading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 6 }, (_, i) => (
                  <Skeleton key={i} className="h-14" />
                ))}
              </div>
            ) : (convos ?? []).length === 0 ? (
              <EmptyState
                icon={<MessagesSquare />}
                title="No conversations yet"
                description="Chats from the playground and your website widget appear here."
                action={
                  <Link href="/assistants" className={buttonVariants({ variant: "primary", size: "sm" })}>
                    Open an assistant
                  </Link>
                }
              />
            ) : shown.length === 0 ? (
              <EmptyState icon={<Search />} title="No matches" description="No conversation matches these filters." />
            ) : (
              <ul className="stagger" aria-label="Conversations">
                {shown.map((c, i) => (
                  <li key={c.id} style={staggerStyle(i)}>
                    <Row c={c} active={c.id === selectedId} onSelect={() => select(c.id)} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Panel>

        {/* Transcript */}
        <Panel className={cn("flex min-h-[60vh] flex-col overflow-hidden lg:min-h-0", !selectedId && "hidden lg:flex")}>
          {!selectedId ? (
            <EmptyState
              icon={<MessagesSquare />}
              title="Pick a conversation"
              description="Read the full transcript and open the documents each answer cited."
              className="my-auto"
            />
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                <button
                  type="button"
                  onClick={() => select(null)}
                  aria-label="Back to the list"
                  className="flex size-8 items-center justify-center rounded-md text-fg-muted hover:bg-sunken hover:text-fg lg:hidden"
                >
                  <ArrowLeft className="size-4" />
                </button>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-[15px] font-semibold text-fg">{selected?.assistant?.name ?? "Conversation"}</h2>
                  {selected && (
                    <p className="text-[12.5px] text-fg-muted">
                      {channelLabel[selected.channel]} ·{" "}
                      {new Date(selected.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                      {selected.visitorId && ` · visitor ${selected.visitorId.slice(0, 8)}`}
                    </p>
                  )}
                </div>
                {selected && <Badge tone={selected.resolved ? "success" : "warning"}>{selected.resolved ? "Resolved" : "Open"}</Badge>}
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 scrollbar-thin sm:px-6">
                {loadingMessages ? (
                  <div className="space-y-4">
                    <Skeleton className="ml-auto h-10 w-2/3" />
                    <Skeleton className="h-20 w-5/6" />
                  </div>
                ) : (
                  <ol className="mx-auto flex max-w-3xl flex-col gap-5" aria-label="Messages">
                    {(messages ?? []).map((m) => (
                      <li key={m.id}>
                        {m.role === "USER" ? (
                          <div className="flex justify-end">
                            <div className="max-w-[85%]">
                              <div className="whitespace-pre-wrap rounded-2xl rounded-br-md bg-inverse px-4 py-2.5 text-[14px] leading-relaxed text-inverse-fg">
                                {m.content}
                              </div>
                              <p className="mt-1 text-right text-[11.5px] text-fg-muted">
                                Customer · {new Date(m.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <AnswerMessage m={m} onOpen={setViewing} />
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </>
          )}
        </Panel>
      </div>

      {viewing && (
        <DocumentViewer documentId={viewing.documentId} fallbackName={viewing.documentName} onClose={() => setViewing(null)} />
      )}
    </div>
  );
}

function Row({ c, active, onSelect }: { c: ConversationRow; active: boolean; onSelect: () => void }) {
  const Icon = channelIcon[c.channel];
  return (
    <HoverCard
      delay="long"
      side="right"
      trigger={
        <button
          type="button"
          onClick={onSelect}
          aria-current={active ? "true" : undefined}
          className={cn(
            "flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors",
            active ? "bg-accent-soft" : "hover:bg-surface-2",
          )}
        >
          <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-fg-subtle" />
          <span className="min-w-0 flex-1">
            <span className="flex items-center justify-between gap-2">
              <span className="truncate text-[13.5px] font-medium text-fg">{c.assistant?.name ?? "Assistant"}</span>
              <span className="shrink-0 text-[12px] text-fg-muted">
                {formatDistanceToNowStrict(new Date(c.createdAt), { addSuffix: true })}
              </span>
            </span>
            <span className="mt-0.5 flex items-center gap-2 text-[12px] text-fg-muted">
              {channelLabel[c.channel]}
              {c.visitorId && <span className="font-mono">· {c.visitorId.slice(0, 8)}</span>}
              {!c.resolved && <Badge tone="warning" className="ml-auto">Open</Badge>}
            </span>
          </span>
        </button>
      }
    >
      <p className="font-medium">{c.assistant?.name ?? "Assistant"}</p>
      <HoverStats
        rows={[
          { label: "Channel", value: channelLabel[c.channel] },
          { label: "Started", value: new Date(c.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) },
          { label: "Last activity", value: formatDistanceToNowStrict(new Date(c.updatedAt), { addSuffix: true }) },
          { label: "Status", value: c.resolved ? "Resolved" : "Not resolved" },
          { label: "Rating", value: c.rating ?? "Not rated" },
        ]}
      />
    </HoverCard>
  );
}

function AnswerMessage({ m, onOpen }: { m: MessageRow; onOpen: (c: Citation) => void }) {
  const cites = m.citations ?? [];
  const parts = segments(m.content);
  return (
    <div className="max-w-[92%]">
      <p className="mb-1 flex items-center gap-1.5 text-[11.5px] text-fg-muted">
        <Bot aria-hidden className="size-3.5" /> Assistant ·{" "}
        {new Date(m.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
      </p>
      <div className="whitespace-pre-wrap text-[14px] leading-[1.7] text-fg">
        {parts.map((s, i) =>
          typeof s === "string" ? (
            <span key={i}>{s}</span>
          ) : (
            <span key={i} className="whitespace-nowrap">
              {s.nums.map((n) => {
                const c = cites[n - 1];
                if (!c) return <span key={n}>[{n}]</span>;
                return (
                  <HoverCard
                    key={n}
                    trigger={
                      <button
                        type="button"
                        onClick={() => onOpen(c)}
                        aria-label={`Source ${n}: ${c.documentName}`}
                        className="mx-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded bg-accent-soft px-1 align-[1px] font-mono text-[11px] font-medium text-accent-text transition-colors hover:bg-accent hover:text-accent-fg"
                      >
                        {n}
                      </button>
                    }
                  >
                    <p className="flex items-center gap-2 font-medium">
                      <FileText aria-hidden className="size-4 text-accent-text" /> {c.documentName}
                    </p>
                    {typeof c.similarity === "number" && (
                      <HoverStats rows={[{ label: "Match", value: `${Math.round(c.similarity * 100)}%` }]} />
                    )}
                    <p className="mt-3 text-[12.5px] text-fg-muted">Click to read the document.</p>
                  </HoverCard>
                );
              })}
              {s.tail}
            </span>
          ),
        )}
      </div>
      {cites.length > 0 && (
        <div className="mt-2.5">
          <p className="text-[11.5px] text-fg-muted">Retrieved for this answer</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {cites.map((c, i) => (
              <button
                key={`${c.documentId}-${i}`}
                type="button"
                onClick={() => onOpen(c)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-[12px] text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
              >
                <span className="font-mono text-[11px]">{i + 1}</span>
                {c.documentName}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
