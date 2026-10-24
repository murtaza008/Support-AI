"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { useState, type FormEvent } from "react";
import { Bot, Plus, X, PlayCircle, Code2, Copy, Check, ExternalLink } from "lucide-react";
import { useCurrentWorkspace } from "@/lib/hooks/use-current-workspace";
import { Reveal } from "@/components/motion/Reveal";

type Assistant = {
  id: string;
  name: string;
  tone: string;
  description: string | null;
  brandColor: string;
  createdAt: string;
};

export default function AssistantsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [embedFor, setEmbedFor] = useState<Assistant | null>(null);

  const { data: ws } = useCurrentWorkspace();

  const { data: assistants, isLoading } = useQuery({
    queryKey: ["assistants", ws?.id],
    queryFn: async (): Promise<Assistant[]> => {
      const res = await fetch(`/api/assistants?workspaceId=${ws!.id}`);
      if (!res.ok) throw new Error("Failed to load assistants");
      return res.json();
    },
    enabled: !!ws,
  });

  return (
    <div className="max-w-6xl mx-auto px-8 py-10">
      <Reveal className="flex items-end justify-between">
        <div>
          <div className="font-mono-caps text-signal">Assistants</div>
          <h1
            className="mt-2 font-display text-4xl md:text-5xl font-semibold"
            style={{ letterSpacing: "-0.02em" }}
          >
            Your AI agents.
          </h1>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-signal text-white rounded-md font-medium hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-8px_rgba(255,90,54,0.5)] transition-all"
        >
          <Plus className="size-4" /> New assistant
        </button>
      </Reveal>

      <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading &&
          [0, 1, 2].map((i) => (
            <div key={i} className="h-40 rounded-lg bg-paper-raised hairline animate-pulse" />
          ))}
        {!isLoading &&
          (assistants ?? []).map((a, i) => (
            <Reveal
              key={a.id}
              delay={Math.min(i, 6) * 0.04}
              className="group bg-paper-raised hairline rounded-lg p-5 hover:border-ink/40 hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-md bg-signal-dim text-signal flex items-center justify-center">
                  <Bot className="size-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-display text-lg font-semibold text-ink truncate">
                    {a.name}
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground uppercase">
                    {a.tone}
                  </div>
                </div>
              </div>
              {a.description && (
                <p className="mt-4 text-sm text-muted-foreground line-clamp-2">
                  {a.description}
                </p>
              )}
              <div className="mt-5 pt-4 border-t border-line flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-muted-foreground uppercase truncate">
                  {new Date(a.createdAt).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setEmbedFor(a)}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full hairline bg-paper text-ink hover:border-ink/40 transition-colors"
                  >
                    <Code2 className="size-3" /> Embed
                  </button>
                  <a
                    href={`/widget-preview/${a.id}`}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full hairline bg-paper text-ink hover:border-ink/40 transition-colors"
                  >
                    <ExternalLink className="size-3" /> Widget
                  </a>
                  <Link
                    href={`/assistants/${a.id}/playground`}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-ink text-paper hover:bg-signal transition-colors"
                  >
                    <PlayCircle className="size-3" /> Test
                  </Link>
                </div>
              </div>
            </Reveal>
          ))}
        {!isLoading && (assistants ?? []).length === 0 && (
          <div className="col-span-full text-center py-16 bg-paper-raised hairline rounded-lg">
            <div className="mx-auto size-12 rounded-full bg-signal-dim text-signal flex items-center justify-center">
              <Bot className="size-5" />
            </div>
            <h3 className="mt-4 font-display text-xl font-semibold">No assistants yet.</h3>
            <p className="mt-2 text-muted-foreground">
              Spin up your first agent in seconds.
            </p>
            <button
              onClick={() => setOpen(true)}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-ink text-paper rounded-md text-sm hover:bg-signal transition-colors"
            >
              <Plus className="size-4" /> New assistant
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {open && ws && (
          <CreateAssistantModal
            workspaceId={ws.id}
            onClose={() => setOpen(false)}
            onCreated={() => {
              qc.invalidateQueries({ queryKey: ["assistants", ws.id] });
              setOpen(false);
            }}
          />
        )}
        {embedFor && (
          <EmbedModal
            assistantId={embedFor.id}
            assistantName={embedFor.name}
            brandColor={embedFor.brandColor}
            onClose={() => setEmbedFor(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CreateAssistantModal({
  workspaceId,
  onClose,
  onCreated,
}: {
  workspaceId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tone, setTone] = useState("friendly");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/assistants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          name: name.trim(),
          description: description.trim() || undefined,
          tone,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not create assistant.");
      }
      onCreated();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not create assistant.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-paper rounded-xl shadow-2xl border border-line p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="font-mono-caps text-signal">New assistant</div>
            <h2 className="mt-1 font-display text-2xl font-semibold">Name your agent.</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </div>

        <label className="block mt-6">
          <span className="font-mono-caps text-muted-foreground">Name</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            placeholder="Support Bot"
            className="mt-1.5 w-full px-3 py-2.5 bg-paper-raised hairline rounded-md focus:border-signal focus:outline-none"
          />
        </label>

        <label className="block mt-4">
          <span className="font-mono-caps text-muted-foreground">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Answers billing and onboarding questions."
            rows={2}
            className="mt-1.5 w-full px-3 py-2.5 bg-paper-raised hairline rounded-md focus:border-signal focus:outline-none resize-none"
          />
        </label>

        <label className="block mt-4">
          <span className="font-mono-caps text-muted-foreground">Tone</span>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {["friendly", "professional", "playful"].map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setTone(t)}
                className={`px-3 py-2 rounded-md text-sm capitalize transition-all ${
                  tone === t
                    ? "bg-ink text-paper"
                    : "bg-paper-raised hairline hover:border-ink/40"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </label>

        {err && <p className="mt-3 text-sm text-destructive">{err}</p>}

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-ink/70 hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-signal text-white rounded-md text-sm font-medium hover:bg-[#e84a26] transition-colors disabled:opacity-60"
          >
            {loading ? "Creating…" : "Create assistant"}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

function EmbedModal({
  assistantId,
  assistantName,
  brandColor,
  onClose,
}: {
  assistantId: string;
  assistantName: string;
  brandColor: string;
  onClose: () => void;
}) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const attr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  const snippet = `<script src="${origin}/api/public/widget/embed.js"
  data-assistant="${assistantId}"
  data-title="${attr(assistantName)}"
  data-color="${attr(brandColor)}"
  async></script>`;
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-xl bg-paper rounded-xl shadow-2xl border border-line p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="font-mono-caps text-signal">Embed widget</div>
            <h2 className="mt-1 font-display text-2xl font-semibold">
              Drop {assistantName} onto any site.
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          Paste this before the closing <code>&lt;/body&gt;</code> tag. The floating
          chat button appears in the bottom-right corner. Answers pull from this
          assistant&rsquo;s knowledge base in real time.
        </p>

        <div className="mt-4 relative">
          <pre className="bg-ink text-paper text-xs font-mono p-4 rounded-md overflow-x-auto whitespace-pre">
            {snippet}
          </pre>
          <button
            onClick={copy}
            className="absolute top-2 right-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-paper/10 text-paper text-xs hover:bg-paper/20 transition-colors"
          >
            {copied ? (
              <>
                <Check className="size-3" /> Copied
              </>
            ) : (
              <>
                <Copy className="size-3" /> Copy
              </>
            )}
          </button>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <a
            href={`/widget-preview/${assistantId}`}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1.5 text-sm text-signal font-medium hover:underline"
          >
            <ExternalLink className="size-3.5" /> Preview the widget on a sample site
          </a>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-ink text-paper rounded-md text-sm font-medium hover:bg-signal transition-colors"
          >
            Done
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
