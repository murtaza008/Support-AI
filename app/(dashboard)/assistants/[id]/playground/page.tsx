"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useState, useEffect, useRef, useMemo, type FormEvent } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Send, Sparkles, Bot } from "lucide-react";
import { useCurrentWorkspace } from "@/lib/hooks/use-current-workspace";

type Assistant = {
  id: string;
  name: string;
  tone: string;
  description: string | null;
  workspaceId: string;
};

export default function PlaygroundPage() {
  const { id: assistantId } = useParams<{ id: string }>();
  const { data: ws } = useCurrentWorkspace();

  const { data: assistant } = useQuery({
    queryKey: ["assistant", assistantId],
    queryFn: async (): Promise<Assistant> => {
      const res = await fetch(`/api/assistants/${assistantId}`);
      if (!res.ok) throw new Error("Failed to load assistant");
      return res.json();
    },
  });

  // `convIdRef` is read/written from inside the transport's `fetch` callback,
  // which the AI SDK invokes later on each request — not during render — so
  // this is safe despite the lint rule's conservative static check.
  const convIdRef = useRef<string | null>(null);
  const transport = useMemo(() => {
    // eslint-disable-next-line react-hooks/refs -- ref is only touched inside an async fetch callback, never during render
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
        if (cid) convIdRef.current = cid;
        return res;
      },
    });
  }, [assistantId, ws?.id]);

  const { messages, sendMessage, status, error } = useChat({
    id: assistantId,
    transport,
  });

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const busy = status === "submitted" || status === "streaming";

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || busy || !ws) return;
    const text = input.trim();
    setInput("");
    await sendMessage({ text });
  }

  return (
    <div className="max-w-4xl mx-auto px-8 py-10 h-screen flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/assistants"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-ink transition-colors"
          >
            <ArrowLeft className="size-3.5" /> Assistants
          </Link>
          <div className="mt-3 flex items-center gap-3">
            <div className="size-10 rounded-md bg-signal-dim text-signal flex items-center justify-center">
              <Bot className="size-5" />
            </div>
            <div>
              <h1
                className="font-display text-2xl font-semibold"
                style={{ letterSpacing: "-0.02em" }}
              >
                {assistant?.name ?? "Assistant"}
              </h1>
              <div className="font-mono-caps text-muted-foreground">
                Playground · {assistant?.tone}
              </div>
            </div>
          </div>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-moss-dim text-moss inline-flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-moss animate-pulse" />
          RAG live
        </span>
      </div>

      <div
        ref={scrollRef}
        className="mt-6 flex-1 min-h-0 overflow-y-auto bg-paper-raised hairline rounded-lg p-6 space-y-5"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="size-12 rounded-full bg-signal-dim text-signal flex items-center justify-center">
              <Sparkles className="size-5" />
            </div>
            <p className="mt-4 font-display text-xl">Say hi to your agent.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Answers pull from your knowledge base in real time.
            </p>
          </div>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} m={m} />
        ))}
        {busy && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <span className="size-1.5 rounded-full bg-signal animate-pulse" />
            <span className="size-1.5 rounded-full bg-signal animate-pulse [animation-delay:150ms]" />
            <span className="size-1.5 rounded-full bg-signal animate-pulse [animation-delay:300ms]" />
          </div>
        )}
        {error && <div className="text-sm text-destructive">{error.message}</div>}
      </div>

      <form onSubmit={send} className="mt-4 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything…"
          className="flex-1 px-4 py-3 bg-paper-raised hairline rounded-md focus:border-signal focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="inline-flex items-center gap-2 px-4 py-3 bg-signal text-white rounded-md font-medium hover:bg-[#e84a26] transition-colors disabled:opacity-60"
        >
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
}

function MessageBubble({ m }: { m: UIMessage }) {
  const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
  const isUser = m.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
          isUser
            ? "bg-ink text-paper rounded-br-sm"
            : "bg-paper hairline text-ink rounded-bl-sm"
        }`}
      >
        <div className="whitespace-pre-wrap text-sm leading-relaxed">{text}</div>
      </div>
    </motion.div>
  );
}
