"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { useCurrentWorkspace } from "@/lib/hooks/use-current-workspace";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { HoverStats } from "@/components/ui/hover-card";
import { PageHeader, Panel, PanelHeader, Skeleton } from "@/components/ui/primitives";

const PRESETS = ["#b3471f", "#ff5a36", "#3d6bff", "#0e6b5d", "#7c3aed", "#16181a"];
const HEX = /^#[0-9a-fA-F]{6}$/;
const planLabel = { STARTER: "Starter", PRO: "Pro", AGENCY: "Agency" } as const;
const roleLabel = { OWNER: "Owner", ADMIN: "Admin", MEMBER: "Member" } as const;

export default function SettingsPage() {
  const qc = useQueryClient();
  const { data: ws } = useCurrentWorkspace();
  const { data: session } = useSession();
  const canManage = ws?.role === "OWNER" || ws?.role === "ADMIN";

  // The form shows the saved values until the user edits a field.
  const [draft, setDraft] = useState<{ name: string; color: string } | null>(null);
  const name = draft?.name ?? ws?.name ?? "";
  const color = draft?.color ?? ws?.brandColor ?? "#b3471f";
  const set = (patch: Partial<{ name: string; color: string }>) => setDraft({ name, color, ...patch });
  const valid = name.trim().length > 0 && HEX.test(color);

  const save = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/workspaces/${ws!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), brandColor: color }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Could not save the workspace");
      }
    },
    onSuccess: () => {
      toast.success("Workspace saved");
      setDraft(null);
      qc.invalidateQueries({ queryKey: ["current-workspace"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
      <PageHeader eyebrow="Settings" title="Workspace settings" description="The workspace name and colour, and your account." />

      <Panel className="mt-8">
        <PanelHeader
          title="Workspace"
          description={canManage ? "Owners and admins can change these." : undefined}
        />
        {!ws ? (
          <Skeleton className="m-5 h-40" />
        ) : (
          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              if (valid) save.mutate();
            }}
            className="space-y-5 px-5 pb-5 pt-4"
          >
            {!canManage && (
              <p className="flex items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-2 text-[13px] text-fg-muted">
                <Lock aria-hidden className="size-4" /> Only owners and admins can change workspace settings. You&rsquo;re a {roleLabel[ws.role].toLowerCase()}.
              </p>
            )}
            <Field label="Workspace name" htmlFor="ws-name">
              <Input id="ws-name" value={name} onChange={(e) => set({ name: e.target.value })} disabled={!canManage} maxLength={80} required />
            </Field>

            <fieldset disabled={!canManage}>
              <legend className="text-[13px] font-medium text-fg">Brand colour</legend>
              <p className="mt-0.5 text-[12.5px] text-fg-muted">Marks the workspace in the sidebar. Each assistant&rsquo;s widget has its own colour.</p>
              <div className="mt-3 flex flex-wrap items-center gap-2.5">
                {PRESETS.map((c) => (
                  <label key={c} className="cursor-pointer">
                    <input type="radio" name="ws-color" className="peer sr-only" checked={color.toLowerCase() === c} onChange={() => set({ color: c })} />
                    <span className="sr-only">{c}</span>
                    <span
                      aria-hidden
                      className="block size-8 rounded-full border border-border-strong ring-offset-2 ring-offset-surface peer-checked:ring-2 peer-checked:ring-fg peer-focus-visible:ring-2 peer-focus-visible:ring-focus"
                      style={{ background: c }}
                    />
                  </label>
                ))}
                <Input
                  aria-label="Hex colour"
                  aria-invalid={!HEX.test(color)}
                  value={color}
                  onChange={(e) => set({ color: e.target.value })}
                  className="h-8 w-28 font-mono text-[12.5px]"
                />
                <input
                  type="color"
                  aria-label="Pick a custom colour"
                  value={HEX.test(color) ? color : "#b3471f"}
                  onChange={(e) => set({ color: e.target.value })}
                  className="size-8 cursor-pointer rounded-md border border-border bg-transparent"
                />
              </div>
              {!HEX.test(color) && <p className="mt-2 text-[12.5px] text-danger-text">Use a hex colour like #b3471f.</p>}
            </fieldset>

            <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-2 p-3">
              <span aria-hidden className="size-8 rounded-md border border-black/10" style={{ background: HEX.test(color) ? color : "transparent" }} />
              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-medium text-fg">{name || "Workspace"}</p>
                <p className="text-[12px] text-fg-muted">
                  {planLabel[ws.plan]} plan ·{" "}
                  <Link href="/billing" className="text-accent-text underline underline-offset-4">
                    Billing
                  </Link>
                </p>
              </div>
              <span className="ml-auto text-[12px] text-fg-muted">Preview</span>
            </div>

            {canManage && (
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setDraft(null)} disabled={!draft || save.isPending}>
                  Discard
                </Button>
                <Button type="submit" variant="primary" disabled={!draft || !valid || save.isPending}>
                  {save.isPending ? "Saving…" : "Save changes"}
                </Button>
              </div>
            )}
          </form>
        )}
      </Panel>

      <Panel className="mt-4">
        <PanelHeader title="Your account" />
        <div className="px-5 pb-5 pt-1">
          <HoverStats
            rows={[
              { label: "Name", value: session?.user?.name ?? "Not set" },
              { label: "Email", value: session?.user?.email ?? "—" },
              { label: "Role in this workspace", value: ws ? roleLabel[ws.role] : "—" },
            ]}
          />
        </div>
      </Panel>
    </div>
  );
}
