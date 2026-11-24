"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as D from "@radix-ui/react-dialog";
import { toast } from "sonner";
import { Bot, Check, Code2, Copy, ExternalLink, MoreHorizontal, Pencil, PlayCircle, Plus, Trash2 } from "lucide-react";
import { useCurrentWorkspace } from "@/lib/hooks/use-current-workspace";
import { q, type AssistantRow } from "@/lib/queries";
import { byAssistant, dailySeries } from "@/lib/analytics-view";
import { Sparkline } from "@/components/data/Sparkline";
import { Button, buttonVariants } from "@/components/ui/button";
import { DialogContent, SheetContent } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { Badge, EmptyState, PageHeader, Skeleton, staggerStyle } from "@/components/ui/primitives";
import { Segmented } from "@/components/ui/segmented";

type Tone = "friendly" | "professional" | "playful";
const TONES: { value: Tone; label: string }[] = [
  { value: "friendly", label: "Friendly" },
  { value: "professional", label: "Professional" },
  { value: "playful", label: "Playful" },
];
const COLORS = ["#b3471f", "#ff5a36", "#3d6bff", "#0e6b5d", "#7c3aed", "#16181a"];

async function errorText(res: Response, fallback: string) {
  const body = await res.json().catch(() => ({}));
  return (body as { error?: string }).error ?? fallback;
}

export default function AssistantsPage() {
  const qc = useQueryClient();
  const { data: ws } = useCurrentWorkspace();
  const wsId = ws?.id ?? "";
  const canDelete = ws?.role === "OWNER" || ws?.role === "ADMIN";
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AssistantRow | null>(null);
  const [embedFor, setEmbedFor] = useState<AssistantRow | null>(null);
  const [deleting, setDeleting] = useState<AssistantRow | null>(null);
  const [now] = useState(() => new Date());

  const { data: assistants, isLoading } = useQuery({ ...q.assistants(wsId), enabled: !!ws });
  const { data: analytics } = useQuery({ ...q.analytics(wsId, 30), enabled: !!ws });
  const stats = useMemo(() => {
    if (!analytics) return new Map<string, ReturnType<typeof byAssistant>[number]>();
    return new Map(byAssistant(analytics, dailySeries(analytics, now)).map((s) => [s.id, s]));
  }, [analytics, now]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["assistants", wsId] });
    qc.invalidateQueries({ queryKey: ["summary", wsId] });
  };

  async function remove(a: AssistantRow) {
    const res = await fetch(`/api/assistants/${a.id}`, { method: "DELETE" });
    if (!res.ok) return toast.error(await errorText(res, "Could not delete the assistant"));
    toast.success(`Deleted “${a.name}”`);
    setDeleting(null);
    refresh();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <PageHeader
        eyebrow="Assistants"
        title="Your assistants"
        description="Each one answers from the same knowledge base, in its own tone and with its own instructions."
        actions={
          <Button variant="primary" onClick={() => setCreating(true)}>
            <Plus /> New assistant
          </Button>
        }
      />

      {isLoading ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-56 rounded-lg" />
          ))}
        </div>
      ) : (assistants ?? []).length === 0 ? (
        <div className="panel mt-8">
          <EmptyState
            icon={<Bot />}
            title="No assistants yet"
            description="An assistant answers customer questions from your documents. Create one, then test it in the playground."
            action={
              <Button variant="primary" onClick={() => setCreating(true)}>
                <Plus /> Create an assistant
              </Button>
            }
          />
        </div>
      ) : (
        <ul className="stagger mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(assistants ?? []).map((a, i) => {
            const s = stats.get(a.id);
            const rate = s && s.conversations ? Math.round((s.resolved / s.conversations) * 100) : null;
            return (
              <li key={a.id} style={staggerStyle(i)} className="panel lift flex flex-col p-5">
                <div className="flex items-start gap-3">
                  <span aria-hidden className="mt-1 size-3 shrink-0 rounded-full" style={{ background: a.brandColor }} />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-[16px] font-semibold text-fg">{a.name}</h2>
                    <Badge tone="outline" className="mt-1 capitalize">{a.tone}</Badge>
                  </div>
                  <Menu>
                    <MenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={`More actions for ${a.name}`}>
                        <MoreHorizontal />
                      </Button>
                    </MenuTrigger>
                    <MenuContent>
                      <MenuItem onSelect={() => setEditing(a)}>
                        <Pencil /> Edit settings
                      </MenuItem>
                      <MenuItem onSelect={() => setEmbedFor(a)}>
                        <Code2 /> Embed on a website
                      </MenuItem>
                      <MenuItem asChild>
                        <a href={`/widget-preview/${a.id}`} target="_blank" rel="noopener">
                          <ExternalLink /> Preview the widget
                        </a>
                      </MenuItem>
                      {canDelete && (
                        <>
                          <MenuSeparator />
                          <MenuItem onSelect={() => setDeleting(a)} className="text-danger-text [&_svg]:text-danger-text">
                            <Trash2 /> Delete
                          </MenuItem>
                        </>
                      )}
                    </MenuContent>
                  </Menu>
                </div>
                <p className="mt-3 line-clamp-2 min-h-[2.6em] text-[13.5px] text-fg-muted">
                  {a.description || "No description yet."}
                </p>
                <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 text-[12px]">
                  <div>
                    <dt className="text-fg-muted">Chats, 30 days</dt>
                    <dd className="tabular text-[15px] font-semibold text-fg">{s?.conversations ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-fg-muted">Resolved</dt>
                    <dd className="tabular text-[15px] font-semibold text-fg">{rate === null ? "—" : `${rate}%`}</dd>
                  </div>
                  <div>
                    <dt className="text-fg-muted">From website</dt>
                    <dd className="tabular text-[15px] font-semibold text-fg">{s?.widget ?? "—"}</dd>
                  </div>
                </dl>
                {s && <Sparkline values={s.daily} height={26} className="mt-3" />}
                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/assistants/${a.id}/playground`}
                    data-press=""
                    className={buttonVariants({ variant: "primary", size: "sm", className: "flex-1" })}
                  >
                    <PlayCircle /> Open playground
                  </Link>
                  <Button variant="secondary" size="sm" onClick={() => setEmbedFor(a)}>
                    <Code2 /> Embed
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {ws && (
        <CreateDialog
          open={creating}
          onOpenChange={setCreating}
          workspaceId={ws.id}
          onCreated={(name) => {
            toast.success(`Created “${name}”`);
            setCreating(false);
            refresh();
          }}
        />
      )}
      {editing && (
        <EditSheet
          assistant={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            toast.success("Assistant saved");
            setEditing(null);
            refresh();
          }}
        />
      )}
      {embedFor && <EmbedDialog assistant={embedFor} onClose={() => setEmbedFor(null)} />}
      <D.Root open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        {deleting && (
          <DialogContent
            title={`Delete “${deleting.name}”?`}
            description="Its conversations are deleted too, and any website using its embed code stops answering. Documents stay in the knowledge base."
          >
            <div className="flex justify-end gap-2 px-5 py-4">
              <D.Close asChild>
                <Button variant="secondary">Cancel</Button>
              </D.Close>
              <Button variant="danger" onClick={() => remove(deleting)}>
                <Trash2 /> Delete assistant
              </Button>
            </div>
          </DialogContent>
        )}
      </D.Root>
    </div>
  );
}

function CreateDialog({
  open,
  onOpenChange,
  workspaceId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  workspaceId: string;
  onCreated: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tone, setTone] = useState<Tone>("friendly");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/assistants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId, name: name.trim(), description: description.trim() || undefined, tone }),
    });
    setBusy(false);
    if (!res.ok) return setErr(await errorText(res, "Could not create the assistant."));
    const created = name.trim();
    setName("");
    setDescription("");
    setTone("friendly");
    onCreated(created);
  }

  return (
    <D.Root open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent title="New assistant" description="You can change everything later, including its instructions.">
        <form onSubmit={submit}>
          <div className="space-y-4 px-5 py-4">
            <Field label="Name" htmlFor="new-name">
              <Input id="new-name" required minLength={2} maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="Help centre assistant" autoFocus />
            </Field>
            <Field label="What it helps with" htmlFor="new-desc" hint="Optional. Also used to steer its answers.">
              <Textarea id="new-desc" rows={3} maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Answers billing and account questions for our customers." aria-describedby="new-desc-hint" />
            </Field>
            <div className="space-y-1.5">
              <span className="block text-[13px] font-medium text-fg" id="new-tone-label">Tone</span>
              <Segmented label="Tone" value={tone} onChange={setTone} options={TONES} />
            </div>
            {err && <p role="alert" className="rounded-md border border-danger-text/30 bg-danger-soft px-3 py-2 text-[13px] text-danger-text">{err}</p>}
          </div>
          <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
            <D.Close asChild>
              <Button variant="secondary" disabled={busy}>Cancel</Button>
            </D.Close>
            <Button type="submit" variant="primary" disabled={busy}>{busy ? "Creating…" : "Create assistant"}</Button>
          </div>
        </form>
      </DialogContent>
    </D.Root>
  );
}

function EditSheet({ assistant, onClose, onSaved }: { assistant: AssistantRow; onClose: () => void; onSaved: () => void }) {
  const { data: full } = useQuery({
    queryKey: ["assistant", assistant.id],
    queryFn: async () => {
      const res = await fetch(`/api/assistants/${assistant.id}`);
      if (!res.ok) throw new Error("Failed to load assistant");
      return (await res.json()) as AssistantRow & { systemPrompt: string | null };
    },
  });
  const [draft, setDraft] = useState<{ name: string; description: string; tone: Tone; systemPrompt: string; brandColor: string } | null>(null);
  const base = {
    name: assistant.name,
    description: assistant.description ?? "",
    tone: assistant.tone as Tone,
    systemPrompt: full?.systemPrompt ?? "",
    brandColor: assistant.brandColor,
  };
  const v = draft ?? base;
  const set = (patch: Partial<typeof v>) => setDraft({ ...v, ...patch });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const res = await fetch(`/api/assistants/${assistant.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: v.name.trim(),
        description: v.description.trim() || null,
        tone: v.tone,
        systemPrompt: v.systemPrompt.trim() || null,
        brandColor: v.brandColor,
      }),
    });
    setBusy(false);
    if (!res.ok) return setErr(await errorText(res, "Could not save the assistant."));
    onSaved();
  }

  return (
    <D.Root open onOpenChange={(o) => !o && !busy && onClose()}>
      <SheetContent title={`Edit ${assistant.name}`} side="right" className="w-[min(96vw,30rem)]">
        <form onSubmit={save} className="flex h-full flex-col">
          <div className="border-b border-border px-5 pb-4 pr-14 pt-5">
            <p className="eyebrow">Assistant settings</p>
            <h2 className="mt-1 text-[19px] font-semibold text-fg">{assistant.name}</h2>
          </div>
          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 scrollbar-thin">
            <Field label="Name" htmlFor="edit-name">
              <Input id="edit-name" required minLength={2} maxLength={80} value={v.name} onChange={(e) => set({ name: e.target.value })} />
            </Field>
            <Field label="What it helps with" htmlFor="edit-desc">
              <Textarea id="edit-desc" rows={3} maxLength={500} value={v.description} onChange={(e) => set({ description: e.target.value })} />
            </Field>
            <div className="space-y-1.5">
              <span className="block text-[13px] font-medium text-fg">Tone</span>
              <Segmented label="Tone" value={v.tone} onChange={(tone) => set({ tone })} options={TONES} />
            </div>
            <Field
              label="Instructions"
              htmlFor="edit-prompt"
              hint="Added to every answer: what to say when the docs don't cover a question, who to escalate to, words to avoid."
            >
              <Textarea
                id="edit-prompt"
                rows={7}
                maxLength={4000}
                value={v.systemPrompt}
                onChange={(e) => set({ systemPrompt: e.target.value })}
                placeholder="If the documents don't cover the question, say so and suggest emailing support@example.com."
                aria-describedby="edit-prompt-hint"
                disabled={!full}
              />
            </Field>
            <fieldset>
              <legend className="text-[13px] font-medium text-fg">Widget colour</legend>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {COLORS.map((c) => (
                  <label key={c} className="cursor-pointer">
                    <input type="radio" name="edit-color" className="peer sr-only" checked={v.brandColor.toLowerCase() === c} onChange={() => set({ brandColor: c })} />
                    <span className="sr-only">{c}</span>
                    <span aria-hidden className="block size-7 rounded-full border border-border-strong ring-offset-2 ring-offset-surface peer-checked:ring-2 peer-checked:ring-fg peer-focus-visible:ring-2 peer-focus-visible:ring-focus" style={{ background: c }} />
                  </label>
                ))}
                <Input
                  aria-label="Hex colour"
                  value={v.brandColor}
                  onChange={(e) => set({ brandColor: e.target.value })}
                  pattern="^#[0-9a-fA-F]{6}$"
                  className="h-8 w-28 font-mono text-[12.5px]"
                />
              </div>
            </fieldset>
            {err && <p role="alert" className="rounded-md border border-danger-text/30 bg-danger-soft px-3 py-2 text-[13px] text-danger-text">{err}</p>}
          </div>
          <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
            <D.Close asChild>
              <Button variant="secondary" disabled={busy}>Cancel</Button>
            </D.Close>
            <Button type="submit" variant="primary" disabled={busy || !draft}>{busy ? "Saving…" : "Save changes"}</Button>
          </div>
        </form>
      </SheetContent>
    </D.Root>
  );
}

function EmbedDialog({ assistant, onClose }: { assistant: AssistantRow; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const attr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const snippet = `<script src="${origin}/api/public/widget/embed.js"
  data-assistant="${assistant.id}"
  data-title="${attr(assistant.name)}"
  data-color="${attr(assistant.brandColor)}"
  async></script>`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Copy failed. Select the code and copy it manually.");
    }
  }

  return (
    <D.Root open onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={`Put ${assistant.name} on your website`} description="Paste this before the closing </body> tag. A chat bubble appears in the corner." className="max-w-xl">
        <div className="space-y-4 px-5 py-4">
          <div className="relative">
            <pre tabIndex={0} aria-label="Embed code" className="overflow-x-auto rounded-md border border-border bg-sunken p-3 pr-12 font-mono text-[12px] leading-relaxed text-fg scrollbar-thin">
              <code>{snippet}</code>
            </pre>
            <Button variant="secondary" size="icon-sm" onClick={copy} aria-label={copied ? "Copied" : "Copy code"} className="absolute right-2 top-2">
              {copied ? <Check /> : <Copy />}
            </Button>
          </div>
          <ul className="space-y-1.5 text-[13px] text-fg-muted">
            <li>Website chats show up in Conversations, marked “Website”.</li>
            <li>Change the bubble colour in the assistant&rsquo;s settings.</li>
            <li>Use your production domain; preview deployments may block other sites.</li>
          </ul>
        </div>
        <div className="flex justify-between gap-2 border-t border-border px-5 py-4">
          <a href={`/widget-preview/${assistant.id}`} target="_blank" rel="noopener" className={buttonVariants({ variant: "secondary" })}>
            <ExternalLink /> Preview on a sample site
          </a>
          <Button variant="primary" onClick={copy}>
            {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy code"}
          </Button>
        </div>
      </DialogContent>
    </D.Root>
  );
}
