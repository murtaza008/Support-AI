"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowLeft, ArrowUp, BookOpen, FileText, RotateCcw, Square } from "lucide-react";
import { useCurrentWorkspace } from "@/lib/hooks/use-current-workspace";
import { q } from "@/lib/queries";
import { DocumentViewer } from "@/components/dashboard/DocumentViewer";
import { HoverCard, HoverStats } from "@/components/ui/hover-card";
import { Badge, Kbd } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { parseCitationsHeader, segments, type Citation } from "@/lib/citations";


/** Matches the server limit in lib/chat.ts. */
const MAX_CHARS = 4000;


const pct = (s: number) => `${Math.round(Math.max(0, Math.min(1, s)) * 100)}%`;

export default function PlaygroundPage() {
  const { id: assistantId } = useParams<{ id: string }>();
  const { data: ws } = useCurrentWorkspace();
  const wsId = ws?.id ?? "";

  const { data: assistant } = useQuery({
    queryKey: ["assistant", assistantId],
    queryFn: async () => {
      const res = await fetch(`/api/assistants/${assistantId}`);
      if (!res.ok) throw new Error("Failed to load assistant");
      return (await res.json()) as { id: string; name: string; tone: string; description: string | null; brandColor: string };
    },
  });
  const { data: documents } = useQuery({ ...q.documents(wsId), enabled: !!ws });
  const ready = useMemo(() => (documents ?? []).filter((d) => d.status === "READY"), [documents]);

  // Citations for each answer, in answer order, read from the X-Citations header.
  const [citations, setCitations] = useState<Citation[][]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const convIdRef = useRef<string | null>(null);

  // The ref is only read and written inside the transport's async fetch callback,
  // which the AI SDK calls per request, never during render.
  // eslint-disable-next-line react-hooks/refs -- see above
  const transport = useMemo(() => {
    return new DefaultChatTransport({
      api: "/api/chat",
      fetch: async (input, init) => {
        let body = init?.body;
        if (body && typeof body === "string") {
          const parsed = JSON.parse(body);
          parsed.assistantId = assistantId;
          parsed.workspaceId = ws?.id;
          parsed.conversationId = convIdRef.current;
          body = JSON.stringify(parsed);
        }
        const res = await fetch(input, { ...init, body });
        const cid = res.headers.get("X-Conversation-Id");
        if (cid) {
          convIdRef.current = cid;
          setConversationId(cid);
        }
        if (res.ok) {
          const cites = parseCitationsHeader(res.headers.get("X-Citations"));
          setCitations((prev) => [...prev, cites]);
        }
        return res;
      },
    });
  }, [assistantId, ws?.id]);

  const { messages, sendMessage, status, error, stop, setMessages, clearError } = useChat({
    id: assistantId,
    transport,
  });

  const [input, setInput] = useState("");
  const [viewing, setViewing] = useState<Citation | null>(null);
  const [focus, setFocus] = useState<{ answer: number; n: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const busy = status === "submitted" || status === "streaming";

  // Keep the newest message in view; instant, so typing never waits on a scroll.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, status]);

  // Grow the textarea with its content (up to ~8 lines).
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [input]);

  async function send(text: string) {
    const t = text.trim();
    if (!t || busy || !ws || t.length > MAX_CHARS) return;
    setInput("");
    clearError();
    await sendMessage({ text: t });
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send(input);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send(input);
    }
  }

  function newChat() {
    stop();
    setMessages([]);
    setCitations([]);
    setFocus(null);
    convIdRef.current = null;
    setConversationId(null);
    clearError();
    inputRef.current?.focus();
  }

  // Index of each assistant message among answers, to find its citations.
  const answerIndex = new Map<string, number>();
  messages.filter((m) => m.role === "assistant").forEach((m, i) => answerIndex.set(m.id, i));
  const lastAnswer = messages.filter((m) => m.role === "assistant").length - 1;
  const panelAnswer = focus?.answer ?? lastAnswer;
  const panelCites = panelAnswer >= 0 ? (citations[panelAnswer] ?? []) : [];

  const suggestions = ready.slice(0, 3).map((d) => `What does “${d.name}” cover?`);

  return (
    <div className="flex h-[calc(100dvh-3.5rem-var(--banner-h,0px))] min-h-[520px] flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 sm:px-6">
        <Link
          href="/assistants"
          aria-label="Back to assistants"
          className="flex size-8 items-center justify-center rounded-md text-fg-muted hover:bg-sunken hover:text-fg"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <span aria-hidden className="size-3 rounded-full" style={{ background: assistant?.brandColor ?? "var(--accent)" }} />
        <div className="min-w-0">
          <h1 className="truncate text-[17px] font-semibold leading-tight text-fg">{assistant?.name ?? "Assistant"}</h1>
          <HoverCard
            trigger={
              <button type="button" className="text-[12.5px] text-fg-muted underline-offset-4 hover:text-fg hover:underline">
                Answers from {ready.length} {ready.length === 1 ? "document" : "documents"}
              </button>
            }
          >
            <p className="font-medium">Knowledge this assistant uses</p>
            <p className="mt-0.5 text-[12.5px] text-fg-muted">Every ready document in the workspace.</p>
            <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-[13px]">
              {ready.map((d) => (
                <li key={d.id} className="flex justify-between gap-3">
                  <span className="truncate text-fg">{d.name}</span>
                  <span className="shrink-0 tabular text-fg-muted">{d.chunkCount} passages</span>
                </li>
              ))}
            </ul>
          </HoverCard>
        </div>
        {assistant && <Badge tone="outline" className="capitalize">{assistant.tone}</Badge>}
        <div className="ml-auto flex items-center gap-2">
          {conversationId && (
            <Link href={`/conversations?c=${conversationId}`} className="hidden text-[13px] text-fg-muted underline-offset-4 hover:text-fg hover:underline sm:inline">
              View in Conversations
            </Link>
          )}
          <Button variant="secondary" size="sm" onClick={newChat} disabled={messages.length === 0}>
            <RotateCcw /> New chat
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Chat */}
        <div className="flex min-h-0 flex-col">
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto scrollbar-thin" aria-busy={busy}>
            <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6 sm:px-6">
              {messages.length === 0 && (
                <div className="mx-auto mt-[8vh] max-w-md text-center">
                  <p className="text-[18px] font-semibold text-fg">Ask what a customer would ask</p>
                  <p className="mt-1.5 text-[14px] text-fg-muted">
                    Answers use only your documents and number their sources. Chats here are saved to Conversations.
                  </p>
                  {suggestions.length > 0 && (
                    <div className="mt-5 flex flex-col items-center gap-2">
                      {suggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          data-press=""
                          onClick={() => void send(s)}
                          className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-[13px] text-fg shadow-[inset_0_1px_0_var(--highlight)] transition-colors hover:border-border-strong"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {messages.map((m) =>
                m.role === "user" ? (
                  <UserBubble key={m.id} m={m} />
                ) : (
                  <Answer
                    key={m.id}
                    m={m}
                    cites={citations[answerIndex.get(m.id) ?? -1] ?? []}
                    index={answerIndex.get(m.id) ?? 0}
                    focus={focus}
                    onFocusCite={setFocus}
                    onOpen={setViewing}
                  />
                ),
              )}

              {status === "submitted" && (
                <div className="flex items-center gap-1.5 px-1 text-fg-subtle" aria-label="Looking through your documents">
                  <span className="size-1.5 animate-pulse rounded-full bg-current" />
                  <span className="size-1.5 animate-pulse rounded-full bg-current [animation-delay:150ms]" />
                  <span className="size-1.5 animate-pulse rounded-full bg-current [animation-delay:300ms]" />
                  <span className="ml-2 text-[13px] text-fg-muted">Searching your documents…</span>
                </div>
              )}

              {error && (
                <div role="alert" className="rounded-lg border border-danger-text/30 bg-danger-soft px-4 py-3 text-[13.5px] text-danger-text">
                  {error.message || "Something went wrong. Try again."}
                </div>
              )}
            </div>
          </div>

          {/* Announce finished answers once, not every streamed word. */}
          <p className="sr-only" aria-live="polite">
            {status === "ready" && lastAnswer >= 0 ? `Answer ${lastAnswer + 1} received` : ""}
          </p>

          {/* Composer */}
          <form onSubmit={onSubmit} className="border-t border-border bg-bg px-4 py-3 sm:px-6">
            <div className="mx-auto max-w-3xl">
              <div className="flex items-end gap-2 rounded-xl border border-border-strong bg-surface p-2 shadow-[inset_0_1px_0_var(--highlight),var(--shadow-sm)] focus-within:border-accent focus-within:ring-[3px] focus-within:ring-accent/20">
                <label htmlFor="playground-input" className="sr-only">
                  Message {assistant?.name ?? "the assistant"}
                </label>
                <textarea
                  id="playground-input"
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Ask a question…"
                  maxLength={MAX_CHARS}
                  className="max-h-[200px] min-h-[36px] flex-1 resize-none bg-transparent px-2 py-1.5 text-[14.5px] leading-relaxed text-fg outline-none placeholder:text-fg-subtle"
                />
                {busy ? (
                  <Button type="button" variant="secondary" size="icon-sm" onClick={stop} aria-label="Stop answering">
                    <Square className="size-3.5 fill-current" />
                  </Button>
                ) : (
                  <Button type="submit" variant="primary" size="icon-sm" disabled={!input.trim()} aria-label="Send">
                    <ArrowUp />
                  </Button>
                )}
              </div>
              <div className="mt-1.5 flex justify-between gap-3 px-1 text-[12px] text-fg-muted">
                <span>
                  <span className="hidden sm:inline">
                    <Kbd>Enter</Kbd> to send, <Kbd>Shift</Kbd>+<Kbd>Enter</Kbd> for a new line
                    {ws?.isDemo && " · "}
                  </span>
                  {ws?.isDemo && "Demo: 15 messages an hour"}
                </span>
                {input.length > MAX_CHARS * 0.8 && (
                  <span className="tabular">
                    {input.length.toLocaleString("en-US")} / {MAX_CHARS.toLocaleString("en-US")}
                  </span>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Sources */}
        <aside aria-labelledby="sources-title" className="hidden min-h-0 flex-col border-l border-border bg-surface-2 lg:flex">
          <div className="border-b border-border px-5 py-4">
            <h2 id="sources-title" className="text-[14px] font-semibold text-fg">
              Sources
            </h2>
            <p className="mt-0.5 text-[12.5px] text-fg-muted">
              {panelAnswer >= 0
                ? focus
                  ? `Passages retrieved for answer ${focus.answer + 1}`
                  : "Passages retrieved for the latest answer"
                : "Each answer is built from up to 6 matching passages."}
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3 scrollbar-thin">
            {panelAnswer < 0 ? (
              <div className="px-2 py-8 text-center">
                <BookOpen aria-hidden className="mx-auto size-5 text-fg-subtle" />
                <p className="mt-2 text-[13px] text-fg-muted">Ask a question to see which passages the answer used.</p>
              </div>
            ) : panelCites.length === 0 ? (
              <p className="px-2 py-8 text-center text-[13px] text-fg-muted">
                No passage matched this question, so the assistant had nothing to cite.
              </p>
            ) : (
              <ol className="space-y-1.5">
                {panelCites.map((c, i) => {
                  const on = focus?.answer === panelAnswer && focus.n === i + 1;
                  return (
                    <li key={`${c.documentId}-${i}`}>
                      <button
                        type="button"
                        onClick={() => setViewing(c)}
                        className={cn(
                          "w-full rounded-md border px-3 py-2.5 text-left transition-colors",
                          on ? "border-accent bg-accent-soft" : "border-border bg-surface hover:border-border-strong",
                        )}
                      >
                        <span className="flex items-center gap-2 text-[13px]">
                          <span className="flex h-5 min-w-5 items-center justify-center rounded bg-sunken px-1 font-mono text-[11px] text-fg-muted">
                            {i + 1}
                          </span>
                          <span className="min-w-0 flex-1 truncate font-medium text-fg">{c.documentName}</span>
                          <span className="tabular text-[12px] text-fg-muted">{pct(c.similarity)}</span>
                        </span>
                        <span className="mt-2 block h-1 overflow-hidden rounded-full bg-sunken">
                          <span className="block h-full rounded-full bg-chart-1" style={{ width: pct(c.similarity) }} />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
          {panelCites.length > 0 && (
            <p className="border-t border-border px-5 py-3 text-[12px] text-fg-muted">
              Match is how close each passage is to the question (cosine similarity).
            </p>
          )}
        </aside>
      </div>

      {viewing && (
        <DocumentViewer documentId={viewing.documentId} fallbackName={viewing.documentName} onClose={() => setViewing(null)} />
      )}
    </div>
  );
}

function textOf(m: UIMessage) {
  return m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}

function UserBubble({ m }: { m: UIMessage }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-inverse px-4 py-2.5 text-[14.5px] leading-relaxed text-inverse-fg">
        {textOf(m)}
      </div>
    </div>
  );
}


function Answer({
  m,
  cites,
  index,
  focus,
  onFocusCite,
  onOpen,
}: {
  m: UIMessage;
  cites: Citation[];
  index: number;
  focus: { answer: number; n: number } | null;
  onFocusCite: (f: { answer: number; n: number } | null) => void;
  onOpen: (c: Citation) => void;
}) {
  const text = textOf(m);
  const used = [...new Set(segments(text).flatMap((s) => (typeof s === "string" ? [] : s.nums)))]
    .map((n) => ({ n, c: cites[n - 1] }))
    .filter((x): x is { n: number; c: Citation } => !!x.c);

  return (
    <div className="max-w-[92%]">
      <div className="whitespace-pre-wrap text-[14.5px] leading-[1.7] text-fg">
        {segments(text).map((s, i) =>
          typeof s === "string" ? (
            <span key={i}>{s}</span>
          ) : (
            <span key={i} className="whitespace-nowrap">
              {s.nums.map((n) => {
              const c = cites[n - 1];
              if (!c) return <span key={`${i}-${n}`}>[{n}]</span>;
              const on = focus?.answer === index && focus.n === n;
              return (
                <HoverCard
                  key={`${i}-${n}`}
                  delay="short"
                  trigger={
                    <button
                      type="button"
                      onClick={() => onOpen(c)}
                      onPointerEnter={() => onFocusCite({ answer: index, n })}
                      onFocus={() => onFocusCite({ answer: index, n })}
                      aria-label={`Source ${n}: ${c.documentName}`}
                      className={cn(
                        "mx-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded px-1 align-[1px] font-mono text-[11px] font-medium transition-colors",
                        on ? "bg-accent text-accent-fg" : "bg-accent-soft text-accent-text hover:bg-accent hover:text-accent-fg",
                      )}
                    >
                      {n}
                    </button>
                  }
                >
                  <p className="flex items-center gap-2 font-medium">
                    <FileText aria-hidden className="size-4 text-accent-text" /> {c.documentName}
                  </p>
                  <HoverStats
                    rows={[
                      { label: "Source number", value: n },
                      { label: "Match", value: pct(c.similarity) },
                    ]}
                  />
                  <p className="mt-3 text-[12.5px] text-fg-muted">Click to read the document&rsquo;s passages.</p>
                </HoverCard>
              );
              })}
              {s.tail}
            </span>
          ),
        )}
      </div>
      {used.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {used.map(({ n, c }) => (
            <button
              key={n}
              type="button"
              onClick={() => onOpen(c)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-[12px] text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
            >
              <span className="font-mono text-[11px]">{n}</span>
              {c.documentName}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
