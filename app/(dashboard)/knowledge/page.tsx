"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BookOpen,
  FileText,
  Globe,
  Type,
  Plus,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import { useCurrentWorkspace } from "@/lib/hooks/use-current-workspace";
import { Reveal } from "@/components/motion/Reveal";
import { DocumentViewer } from "@/components/dashboard/DocumentViewer";

type DocumentRow = {
  id: string;
  name: string;
  sourceType: "FILE" | "URL" | "TEXT";
  sourceUrl: string | null;
  status: "PENDING" | "PROCESSING" | "READY" | "ERROR";
  error: string | null;
  charCount: number;
  chunkCount: number;
  createdAt: string;
};

export default function KnowledgePage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState<DocumentRow | null>(null);
  const { data: ws } = useCurrentWorkspace();

  const { data: docs, isLoading } = useQuery({
    queryKey: ["documents", ws?.id],
    queryFn: async (): Promise<DocumentRow[]> => {
      const res = await fetch(`/api/documents?workspaceId=${ws!.id}`);
      if (!res.ok) throw new Error("Failed to load documents");
      return res.json();
    },
    enabled: !!ws,
    refetchInterval: (q) => {
      const rows = q.state.data ?? [];
      return rows.some((r) => r.status === "PROCESSING" || r.status === "PENDING")
        ? 1500
        : false;
    },
  });

  async function del(id: string) {
    if (!confirm("Delete this document and all its chunks?")) return;
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    qc.invalidateQueries({ queryKey: ["documents", ws?.id] });
  }

  return (
    <div className="max-w-6xl mx-auto px-8 py-10">
      <Reveal className="flex items-end justify-between">
        <div>
          <div className="font-mono-caps text-signal">Knowledge</div>
          <h1
            className="mt-2 font-display text-4xl md:text-5xl font-semibold"
            style={{ letterSpacing: "-0.02em" }}
          >
            What your agents know.
          </h1>
          <p className="mt-3 text-muted-foreground">
            Paste text, drop in a URL, or upload a PDF/DOCX/TXT/Markdown file. We
            chunk, embed, and index in seconds.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-signal text-white rounded-md font-medium hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-8px_rgba(255,90,54,0.5)] transition-all"
        >
          <Plus className="size-4" /> Add source
        </button>
      </Reveal>

      <Reveal delay={0.08} className="mt-10 bg-paper-raised hairline rounded-lg overflow-hidden">
        {isLoading && (
          <div className="p-10 text-center font-mono-caps text-muted-foreground animate-pulse">
            Loading…
          </div>
        )}
        {!isLoading && (docs ?? []).length === 0 && (
          <div className="p-16 text-center">
            <div className="mx-auto size-12 rounded-full bg-signal-dim text-signal flex items-center justify-center">
              <BookOpen className="size-5" />
            </div>
            <h3 className="mt-4 font-display text-xl font-semibold">No sources yet.</h3>
            <p className="mt-2 text-muted-foreground">
              Add your first doc — help center article, FAQ, product spec.
            </p>
          </div>
        )}
        {!isLoading && (docs ?? []).length > 0 && (
          <div className="divide-y divide-line">
            {(docs ?? []).map((d, i) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="px-5 py-4 flex items-center gap-4"
              >
                <div className="size-9 rounded-md bg-paper hairline flex items-center justify-center text-ink/60">
                  {d.sourceType === "URL" ? (
                    <Globe className="size-4" />
                  ) : d.sourceType === "TEXT" ? (
                    <Type className="size-4" />
                  ) : (
                    <FileText className="size-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => setViewing(d)}
                    className="block max-w-full font-medium text-ink truncate text-left hover:text-signal transition-colors"
                  >
                    {d.name}
                  </button>
                  <div className="font-mono text-[11px] text-muted-foreground uppercase mt-0.5">
                    {d.chunkCount} chunks · {(d.charCount / 1000).toFixed(1)}k chars ·{" "}
                    {new Date(d.createdAt).toLocaleDateString()}
                  </div>
                  {d.status === "ERROR" && d.error && (
                    <div className="mt-1 text-xs text-destructive truncate">{d.error}</div>
                  )}
                </div>
                <StatusPill status={d.status} />
                <button
                  onClick={() => del(d.id)}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Delete"
                >
                  <Trash2 className="size-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </Reveal>

      <AnimatePresence>
        {open && ws && (
          <AddSourceModal
            workspaceId={ws.id}
            onClose={() => setOpen(false)}
            onDone={() => {
              qc.invalidateQueries({ queryKey: ["documents", ws.id] });
              setOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewing && (
          <DocumentViewer
            documentId={viewing.id}
            fallbackName={viewing.name}
            onClose={() => setViewing(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    READY: { cls: "bg-moss-dim text-moss", label: "ready" },
    PROCESSING: { cls: "bg-signal-dim text-signal animate-pulse", label: "indexing" },
    PENDING: { cls: "bg-paper hairline text-ink/60", label: "pending" },
    ERROR: { cls: "bg-destructive/10 text-destructive", label: "error" },
  };
  const s = map[status] ?? map.PENDING;
  return <span className={`text-xs px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>;
}

function AddSourceModal({
  workspaceId,
  onClose,
  onDone,
}: {
  workspaceId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [tab, setTab] = useState<"text" | "url" | "file">("text");
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      if (tab === "file") {
        const input = document.getElementById("kb-file") as HTMLInputElement | null;
        const file = input?.files?.[0];
        if (!file) throw new Error("Pick a file");
        const form = new FormData();
        form.append("file", file);
        form.append("workspaceId", workspaceId);
        const res = await fetch("/api/documents/upload", { method: "POST", body: form });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Upload failed");
        }
      } else {
        let payloadName = name.trim();
        let content = "";
        let sourceUrl: string | null = null;

        if (tab === "text") {
          content = text.trim();
          if (!payloadName) payloadName = "Pasted text";
        } else {
          sourceUrl = url.trim();
          const fetchRes = await fetch("/api/documents/fetch-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: sourceUrl }),
          });
          if (!fetchRes.ok) throw new Error("Could not fetch that URL");
          const { text: fetched } = await fetchRes.json();
          content = fetched;
          if (!payloadName) payloadName = new URL(sourceUrl).hostname;
        }

        if (!content.trim()) throw new Error("No content to ingest");

        const res = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspaceId,
            name: payloadName,
            sourceType: tab.toUpperCase(),
            sourceUrl,
            content,
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Ingest failed");
        }
      }
      onDone();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Ingest failed");
    } finally {
      setBusy(false);
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
        className="w-full max-w-lg bg-paper rounded-xl shadow-2xl border border-line p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="font-mono-caps text-signal">Add source</div>
            <h2 className="mt-1 font-display text-2xl font-semibold">Feed your agents.</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2">
          {(
            [
              { k: "text", label: "Paste", icon: Type },
              { k: "url", label: "URL", icon: Globe },
              { k: "file", label: "File", icon: FileText },
            ] as const
          ).map((t) => (
            <button
              type="button"
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`px-3 py-2 rounded-md text-sm flex items-center justify-center gap-1.5 transition-all ${
                tab === t.k
                  ? "bg-ink text-paper"
                  : "bg-paper-raised hairline hover:border-ink/40"
              }`}
            >
              <t.icon className="size-3.5" /> {t.label}
            </button>
          ))}
        </div>

        <label className="block mt-5">
          <span className="font-mono-caps text-muted-foreground">Name (optional)</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Product FAQ v2"
            className="mt-1.5 w-full px-3 py-2.5 bg-paper-raised hairline rounded-md focus:border-signal focus:outline-none"
          />
        </label>

        {tab === "text" && (
          <label className="block mt-4">
            <span className="font-mono-caps text-muted-foreground">Text</span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              required
              placeholder="Paste your FAQ, docs, or notes…"
              className="mt-1.5 w-full px-3 py-2.5 bg-paper-raised hairline rounded-md focus:border-signal focus:outline-none resize-y font-mono text-[13px]"
            />
          </label>
        )}
        {tab === "url" && (
          <label className="block mt-4">
            <span className="font-mono-caps text-muted-foreground">URL</span>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              placeholder="https://docs.acme.com/faq"
              className="mt-1.5 w-full px-3 py-2.5 bg-paper-raised hairline rounded-md focus:border-signal focus:outline-none"
            />
          </label>
        )}
        {tab === "file" && (
          <label className="block mt-4">
            <span className="font-mono-caps text-muted-foreground">
              File (PDF, DOCX, TXT, MD)
            </span>
            <input
              id="kb-file"
              type="file"
              accept=".pdf,.docx,.txt,.md,.markdown"
              required
              className="mt-1.5 w-full text-sm file:mr-3 file:px-3 file:py-2 file:rounded-md file:border-0 file:bg-ink file:text-paper file:hover:bg-signal file:cursor-pointer"
            />
          </label>
        )}

        {err && (
          <div className="mt-3 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
            {err}
          </div>
        )}

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
            disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2 bg-signal text-white rounded-md text-sm font-medium hover:bg-[#e84a26] transition-colors disabled:opacity-60"
          >
            {busy && <Loader2 className="size-3.5 animate-spin" />}
            {busy ? "Indexing…" : "Add & index"}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
