"use client";

import { Suspense, useMemo, useRef, useState, type DragEvent, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as D from "@radix-ui/react-dialog";
import { timeAgo } from "@/lib/time";
import { toast } from "sonner";
import { AlertTriangle, BookOpen, FileText, Globe, Loader2, Plus, Search, Trash2, Type, Upload } from "lucide-react";
import { useCurrentWorkspace } from "@/lib/hooks/use-current-workspace";
import { q, type DocumentRow } from "@/lib/queries";
import { DocumentViewer } from "@/components/dashboard/DocumentViewer";
import { Button } from "@/components/ui/button";
import { DialogContent } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/form";
import { HoverCard, HoverStats } from "@/components/ui/hover-card";
import { Badge, EmptyState, PageHeader, Panel, Skeleton, staggerStyle, type BadgeTone } from "@/components/ui/primitives";
import { Segmented } from "@/components/ui/segmented";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Filter = "all" | "ready" | "indexing" | "failed";

const sourceIcon = { FILE: FileText, URL: Globe, TEXT: Type } as const;
const sourceLabel = { FILE: "Uploaded file", URL: "Web page", TEXT: "Pasted text" } as const;
const statusInfo: Record<DocumentRow["status"], { label: string; tone: BadgeTone }> = {
  READY: { label: "Ready", tone: "success" },
  PROCESSING: { label: "Indexing", tone: "accent" },
  PENDING: { label: "Queued", tone: "neutral" },
  ERROR: { label: "Failed", tone: "danger" },
};

export default function KnowledgePage() {
  return (
    <Suspense>
      <Knowledge />
    </Suspense>
  );
}

function Knowledge() {
  const qc = useQueryClient();
  const router = useRouter();
  const params = useSearchParams();
  const { data: ws } = useCurrentWorkspace();
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<DocumentRow | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const { data: docs, isLoading } = useQuery({
    ...q.documents(ws?.id ?? ""),
    enabled: !!ws,
    // Poll while anything is still being indexed.
    refetchInterval: (query) =>
      (query.state.data ?? []).some((r) => r.status === "PROCESSING" || r.status === "PENDING") ? 1500 : false,
  });

  // ?doc=<id> opens the reader (used by the command palette).
  const viewingId = params.get("doc");
  const viewing = viewingId ? (docs ?? []).find((d) => d.id === viewingId) : undefined;
  const openDoc = (id: string | null) => router.replace(id ? `/knowledge?doc=${id}` : "/knowledge", { scroll: false });

  const counts = useMemo(() => {
    const all = docs ?? [];
    return {
      all: all.length,
      ready: all.filter((d) => d.status === "READY").length,
      indexing: all.filter((d) => d.status === "PROCESSING" || d.status === "PENDING").length,
      failed: all.filter((d) => d.status === "ERROR").length,
      passages: all.reduce((n, d) => n + d.chunkCount, 0),
    };
  }, [docs]);

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (docs ?? []).filter((d) => {
      if (filter === "ready" && d.status !== "READY") return false;
      if (filter === "indexing" && d.status !== "PROCESSING" && d.status !== "PENDING") return false;
      if (filter === "failed" && d.status !== "ERROR") return false;
      return !needle || d.name.toLowerCase().includes(needle) || (d.sourceUrl ?? "").toLowerCase().includes(needle);
    });
  }, [docs, filter, query]);

  async function remove(doc: DocumentRow) {
    const res = await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "Could not delete the document");
      return;
    }
    toast.success(`Deleted “${doc.name}”`);
    setDeleting(null);
    qc.invalidateQueries({ queryKey: ["documents", ws?.id] });
    qc.invalidateQueries({ queryKey: ["summary", ws?.id] });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <PageHeader
        eyebrow="Knowledge"
        title="Documents your assistants answer from"
        description={
          docs
            ? `${counts.ready} ready · ${counts.passages.toLocaleString("en-US")} indexed passages. Every assistant in the workspace can cite them.`
            : "Loading your documents…"
        }
        actions={
          <Button variant="primary" onClick={() => setAdding(true)}>
            <Plus /> Add document
          </Button>
        }
      />

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          label="Filter by status"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: `All ${counts.all}` },
            { value: "ready", label: `Ready ${counts.ready}` },
            { value: "indexing", label: `Indexing ${counts.indexing}` },
            { value: "failed", label: `Failed ${counts.failed}` },
          ]}
        />
        <div className="relative sm:w-72">
          <Search aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
          <Input
            type="search"
            aria-label="Search documents"
            placeholder="Search by name or URL"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Panel className="mt-4 overflow-hidden">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-11" />
            ))}
          </div>
        ) : (docs ?? []).length === 0 ? (
          <EmptyState
            icon={<BookOpen />}
            title="No documents yet"
            description="Add a help-centre article, FAQ or policy. Assistants answer only from what is here."
            action={
              <Button variant="primary" onClick={() => setAdding(true)}>
                <Plus /> Add your first document
              </Button>
            }
          />
        ) : shown.length === 0 ? (
          <EmptyState icon={<Search />} title="No matches" description="No document matches this filter or search." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-[13.5px]">
              <caption className="sr-only">Documents</caption>
              <thead>
                <tr className="border-b border-border text-left text-[12px] text-fg-muted">
                  <th scope="col" className="px-4 py-2.5 font-medium">Document</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">Passages</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">Characters</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Added</th>
                  <th scope="col" className="px-4 py-2.5"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="stagger">
                {shown.map((d, i) => {
                  const Icon = sourceIcon[d.sourceType];
                  const s = statusInfo[d.status];
                  return (
                    <tr key={d.id} style={staggerStyle(i)} className="border-b border-border last:border-0 hover:bg-surface-2">
                      <td className="max-w-0 px-4 py-2.5 sm:w-[44%]">
                        <HoverCard
                          delay="long"
                          trigger={
                            <button
                              type="button"
                              onClick={() => openDoc(d.id)}
                              className="flex w-full min-w-0 items-center gap-2.5 text-left"
                            >
                              <Icon aria-hidden className="size-4 shrink-0 text-fg-subtle" />
                              <span className="truncate font-medium text-fg underline-offset-4 hover:underline">{d.name}</span>
                            </button>
                          }
                        >
                          <p className="flex items-center gap-2 font-medium">
                            <Icon aria-hidden className="size-4 text-accent-text" /> {d.name}
                          </p>
                          {d.sourceUrl && <p className="mt-1 truncate text-[12.5px] text-fg-muted">{d.sourceUrl}</p>}
                          <HoverStats
                            rows={[
                              { label: "Source", value: sourceLabel[d.sourceType] },
                              { label: "Passages", value: d.chunkCount },
                              { label: "Characters", value: d.charCount.toLocaleString("en-US") },
                              { label: "Used by", value: d.assistant?.name ?? "All assistants" },
                              { label: "Added", value: new Date(d.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" }) },
                            ]}
                          />
                          {d.error && <p className="mt-3 text-[12.5px] text-danger-text">{d.error}</p>}
                          <p className="mt-3 text-[12.5px] text-fg-muted">Click to read its passages.</p>
                        </HoverCard>
                        {d.status === "ERROR" && d.error && (
                          <p className="mt-1 flex items-center gap-1.5 truncate pl-6.5 text-[12px] text-danger-text">
                            <AlertTriangle aria-hidden className="size-3.5 shrink-0" /> {d.error}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge tone={s.tone} dot>
                          {s.label}
                          {(d.status === "PROCESSING" || d.status === "PENDING") && (
                            <Loader2 aria-hidden className="size-3 animate-spin" />
                          )}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular text-fg">{d.chunkCount}</td>
                      <td className="px-4 py-2.5 text-right tabular text-fg-muted">{d.charCount.toLocaleString("en-US")}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-fg-muted">
                        {timeAgo(new Date(d.createdAt))}
                      </td>
                      <td className="px-2 py-2.5 text-right">
                        <Button variant="ghost" size="icon-sm" aria-label={`Delete ${d.name}`} onClick={() => setDeleting(d)}>
                          <Trash2 />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {ws && (
        <AddDocumentDialog
          open={adding}
          onOpenChange={setAdding}
          workspaceId={ws.id}
          onDone={(name) => {
            toast.success(`Added “${name}”. It’s ready to cite.`);
            qc.invalidateQueries({ queryKey: ["documents", ws.id] });
            qc.invalidateQueries({ queryKey: ["summary", ws.id] });
            setAdding(false);
          }}
        />
      )}

      <D.Root open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        {deleting && (
          <DialogContent
            title={`Delete “${deleting.name}”?`}
            description={`Its ${deleting.chunkCount} passages are removed and assistants stop citing it. Past conversations keep their text.`}
          >
            <div className="flex justify-end gap-2 px-5 py-4">
              <D.Close asChild>
                <Button variant="secondary">Cancel</Button>
              </D.Close>
              <Button variant="danger" onClick={() => remove(deleting)}>
                <Trash2 /> Delete document
              </Button>
            </div>
          </DialogContent>
        )}
      </D.Root>

      {viewingId && (
        <DocumentViewer documentId={viewingId} fallbackName={viewing?.name} onClose={() => openDoc(null)} />
      )}
    </div>
  );
}

function AddDocumentDialog({
  open,
  onOpenChange,
  workspaceId,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  workspaceId: string;
  onDone: (name: string) => void;
}) {
  const [tab, setTab] = useState<"text" | "url" | "file">("text");
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function reset() {
    setName("");
    setText("");
    setUrl("");
    setFile(null);
    setErr(null);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      let finalName = name.trim();
      if (tab === "file") {
        if (!file) throw new Error("Choose a file to upload.");
        const form = new FormData();
        form.append("file", file);
        form.append("workspaceId", workspaceId);
        const res = await fetch("/api/documents/upload", { method: "POST", body: form });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Upload failed.");
        }
        finalName = file.name;
      } else {
        let content = "";
        let sourceUrl: string | null = null;
        if (tab === "text") {
          content = text.trim();
          if (!finalName) finalName = "Pasted text";
        } else {
          sourceUrl = url.trim();
          const fetchRes = await fetch("/api/documents/fetch-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: sourceUrl }),
          });
          if (!fetchRes.ok) {
            const body = await fetchRes.json().catch(() => ({}));
            throw new Error(body.error ?? "Could not fetch that page.");
          }
          content = (await fetchRes.json()).text;
          if (!finalName) finalName = new URL(sourceUrl).hostname;
        }
        if (!content.trim()) throw new Error("There is no text to add.");
        const res = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId, name: finalName, sourceType: tab.toUpperCase(), sourceUrl, content }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Could not add the document.");
        }
      }
      reset();
      onDone(finalName);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not add the document.");
    } finally {
      setBusy(false);
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  }

  return (
    <D.Root open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent
        title="Add a document"
        description="It is split into passages and indexed right away. Large files can take a moment."
        className="max-w-xl"
      >
        <form onSubmit={submit}>
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="px-5 pt-3">
            <TabsList aria-label="How to add it">
              <TabsTrigger value="text"><Type className="size-3.5" /> Paste text</TabsTrigger>
              <TabsTrigger value="url"><Globe className="size-3.5" /> From a URL</TabsTrigger>
              <TabsTrigger value="file"><Upload className="size-3.5" /> Upload a file</TabsTrigger>
            </TabsList>

            <div className="space-y-4 py-4">
              {tab !== "file" && (
                <Field label="Name" htmlFor="doc-name" hint="Optional. Shown when an answer cites it.">
                  <Input id="doc-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Refund policy" aria-describedby="doc-name-hint" />
                </Field>
              )}
              <TabsContent value="text" className="outline-none">
                <Field label="Text" htmlFor="doc-text">
                  <Textarea
                    id="doc-text"
                    rows={8}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    required={tab === "text"}
                    placeholder="Paste an FAQ, a policy or a help article…"
                  />
                </Field>
              </TabsContent>
              <TabsContent value="url" className="outline-none">
                <Field label="Page URL" htmlFor="doc-url" hint="The page text is fetched once. Pages that need JavaScript may come back nearly empty.">
                  <Input
                    id="doc-url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required={tab === "url"}
                    placeholder="https://help.example.com/refunds"
                    aria-describedby="doc-url-hint"
                  />
                </Field>
              </TabsContent>
              <TabsContent value="file" className="outline-none">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  className={`flex flex-col items-center justify-center rounded-lg border border-dashed px-4 py-8 text-center transition-colors ${
                    dragging ? "border-accent bg-accent-soft" : "border-border-strong bg-surface-2"
                  }`}
                >
                  <Upload aria-hidden className="size-5 text-fg-subtle" />
                  <p className="mt-2 text-[13.5px] text-fg">
                    {file ? (
                      <>
                        <span className="font-medium">{file.name}</span> · {(file.size / 1024).toFixed(0)} KB
                      </>
                    ) : (
                      "Drop a PDF, Word, text or Markdown file here"
                    )}
                  </p>
                  <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={() => fileInput.current?.click()}>
                    {file ? "Choose another file" : "Choose a file"}
                  </Button>
                  <input
                    ref={fileInput}
                    id="doc-file"
                    type="file"
                    accept=".pdf,.docx,.txt,.md,.markdown"
                    aria-label="File to upload"
                    className="sr-only"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                  <p className="mt-3 text-[12px] text-fg-muted">Up to 4.5 MB. The file name becomes the document name.</p>
                </div>
              </TabsContent>
              {err && (
                <p role="alert" className="rounded-md border border-danger-text/30 bg-danger-soft px-3 py-2 text-[13px] text-danger-text">
                  {err}
                </p>
              )}
            </div>
          </Tabs>
          <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
            <D.Close asChild>
              <Button variant="secondary" disabled={busy}>Cancel</Button>
            </D.Close>
            <Button type="submit" variant="primary" disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="animate-spin" /> Indexing…
                </>
              ) : (
                "Add document"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </D.Root>
  );
}
