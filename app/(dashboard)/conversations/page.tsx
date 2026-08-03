"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "motion/react";
import { MessagesSquare, Bot, User, Globe, PlayCircle } from "lucide-react";
import { useCurrentWorkspace } from "@/lib/hooks/use-current-workspace";
import { Reveal } from "@/components/motion/Reveal";

type ConvRow = {
  id: string;
  channel: "PLAYGROUND" | "WIDGET" | "API";
  visitorId: string | null;
  createdAt: string;
  assistant: { name: string } | null;
};

type MessageRow = {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  citations: Array<{ documentName: string }> | null;
  createdAt: string;
};

export default function ConversationsPage() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: ws } = useCurrentWorkspace();

  const { data: convos, isLoading } = useQuery({
    queryKey: ["conversations", ws?.id],
    queryFn: async (): Promise<ConvRow[]> => {
      const res = await fetch(`/api/conversations?workspaceId=${ws!.id}`);
      if (!res.ok) throw new Error("Failed to load conversations");
      return res.json();
    },
    enabled: !!ws,
  });

  const { data: messages } = useQuery({
    queryKey: ["messages", selectedId],
    queryFn: async (): Promise<MessageRow[]> => {
      const res = await fetch(`/api/conversations/${selectedId}/messages`);
      if (!res.ok) throw new Error("Failed to load messages");
      return res.json();
    },
    enabled: !!selectedId,
  });

  return (
    <div className="max-w-7xl mx-auto px-8 py-10">
      <Reveal className="flex items-end justify-between">
        <div>
          <div className="font-mono-caps text-signal">Conversations</div>
          <h1
            className="mt-2 font-display text-4xl md:text-5xl font-semibold"
            style={{ letterSpacing: "-0.02em" }}
          >
            Every chat, with citations.
          </h1>
        </div>
      </Reveal>

      <Reveal delay={0.08} className="mt-8 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 h-[70vh]">
        <div className="bg-paper-raised hairline rounded-lg overflow-y-auto">
          {isLoading && (
            <div className="p-6 font-mono-caps text-muted-foreground animate-pulse">
              Loading…
            </div>
          )}
          {!isLoading && (convos ?? []).length === 0 && (
            <div className="p-8 text-center">
              <div className="mx-auto size-10 rounded-full bg-signal-dim text-signal flex items-center justify-center">
                <MessagesSquare className="size-4" />
              </div>
              <p className="mt-3 font-display text-lg">No conversations yet.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Test an assistant or embed the widget to start collecting them.
              </p>
              <button
                onClick={() => router.push("/assistants")}
                className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-ink text-paper rounded-md text-xs hover:bg-signal transition-colors"
              >
                <PlayCircle className="size-3.5" /> Go to Assistants
              </button>
            </div>
          )}
          {(convos ?? []).map((c, i) => {
            const active = c.id === selectedId;
            return (
              <motion.button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.22, delay: i * 0.02 }}
                className={`w-full text-left px-4 py-3 border-b border-line transition-colors ${
                  active ? "bg-ink text-paper" : "hover:bg-paper"
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-mono-caps">
                  {c.channel === "WIDGET" ? (
                    <Globe className="size-3" />
                  ) : (
                    <PlayCircle className="size-3" />
                  )}
                  <span className={active ? "text-paper/70" : "text-muted-foreground"}>
                    {c.channel.toLowerCase()}
                  </span>
                  <span className={active ? "text-paper/50" : "text-muted-foreground"}>·</span>
                  <span className={active ? "text-paper/70" : "text-muted-foreground"}>
                    {new Date(c.createdAt).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="mt-1 text-sm font-medium truncate">
                  {c.assistant?.name ?? "Assistant"}
                </div>
                {c.visitorId && (
                  <div
                    className={`mt-0.5 text-[11px] font-mono truncate ${
                      active ? "text-paper/60" : "text-muted-foreground"
                    }`}
                  >
                    visitor · {c.visitorId.slice(0, 8)}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        <div className="bg-paper-raised hairline rounded-lg overflow-y-auto p-6">
          {!selectedId && (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <div className="mx-auto size-12 rounded-full bg-signal-dim text-signal flex items-center justify-center">
                  <MessagesSquare className="size-5" />
                </div>
                <p className="mt-4 font-display text-xl">Select a conversation.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Read the full transcript and see which knowledge chunks were cited.
                </p>
              </div>
            </div>
          )}
          {selectedId && (
            <div className="space-y-4">
              {(messages ?? []).map((m) => {
                const cites = m.citations ?? [];
                return (
                  <div
                    key={m.id}
                    className={`flex gap-3 ${m.role === "USER" ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`size-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                        m.role === "USER" ? "bg-ink text-paper" : "bg-signal-dim text-signal"
                      }`}
                    >
                      {m.role === "USER" ? (
                        <User className="size-4" />
                      ) : (
                        <Bot className="size-4" />
                      )}
                    </div>
                    <div className="max-w-[75%]">
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                          m.role === "USER"
                            ? "bg-ink text-paper rounded-br-sm"
                            : "bg-paper hairline text-ink rounded-bl-sm"
                        }`}
                      >
                        {m.content}
                      </div>
                      {cites.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {cites.map((c, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-moss-dim text-moss uppercase"
                            >
                              [{idx + 1}] {c.documentName}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Reveal>
    </div>
  );
}
