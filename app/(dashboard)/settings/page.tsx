"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useCurrentWorkspace } from "@/lib/hooks/use-current-workspace";
import { useSession } from "next-auth/react";
import { Reveal } from "@/components/motion/Reveal";

const PRESETS = ["#FF5A36", "#13151A", "#7A9E7E", "#3D6BFF", "#8B5CF6", "#EAB308"];

export default function SettingsPage() {
  const qc = useQueryClient();
  const { data: ws } = useCurrentWorkspace();
  const { data: session } = useSession();

  // Derived from `ws` on every render (no effect needed) until the user
  // edits a field, at which point the local draft takes over.
  const [draft, setDraft] = useState<{ name: string; color: string } | null>(null);
  const name = draft?.name ?? ws?.name ?? "";
  const color = draft?.color ?? ws?.brandColor ?? "#FF5A36";
  const setName = (v: string) => setDraft({ name: v, color });
  const setColor = (v: string) => setDraft({ name, color: v });

  const canManage = ws?.role === "OWNER" || ws?.role === "ADMIN";

  const saveWs = useMutation({
    mutationFn: async () => {
      if (!ws) return;
      const res = await fetch(`/api/workspaces/${ws.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, brandColor: color }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not save workspace");
      }
    },
    onSuccess: () => {
      toast.success("Workspace saved");
      qc.invalidateQueries({ queryKey: ["current-workspace"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="max-w-4xl mx-auto px-8 py-10">
      <Reveal>
        <div className="font-mono-caps text-signal">Settings</div>
        <h1
          className="mt-2 font-display text-4xl md:text-5xl font-semibold"
          style={{ letterSpacing: "-0.02em" }}
        >
          Workspace &amp; profile.
        </h1>
      </Reveal>

      <Reveal delay={0.05} className="mt-10 bg-paper-raised hairline rounded-lg p-6">
        <div className="font-mono-caps text-muted-foreground">Workspace</div>
        <h2 className="mt-1 font-display text-2xl font-semibold">Details</h2>
        <div className="mt-6 grid gap-5">
          <div>
            <label className="font-mono-caps text-muted-foreground">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canManage}
              className="mt-1.5 w-full h-10 px-3 rounded-md hairline bg-paper focus:border-signal focus:outline-none text-sm disabled:opacity-60"
            />
          </div>
          <div>
            <label className="font-mono-caps text-muted-foreground">Brand color</label>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              {PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => canManage && setColor(c)}
                  disabled={!canManage}
                  className={`size-9 rounded-full transition-transform ${color === c ? "ring-2 ring-offset-2 ring-ink scale-105" : "hover:scale-105"}`}
                  style={{ background: c }}
                  aria-label={c}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                disabled={!canManage}
                className="size-9 rounded-full overflow-hidden cursor-pointer"
              />
              <span className="font-mono text-xs text-muted-foreground ml-2">{color}</span>
            </div>
          </div>
          <div>
            <label className="font-mono-caps text-muted-foreground">Plan</label>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-moss-dim text-moss font-mono text-xs uppercase">
                {ws?.plan?.toLowerCase() ?? "starter"}
              </span>
              <a href="/billing" className="text-xs text-signal hover:underline">
                Manage billing →
              </a>
            </div>
          </div>
          {canManage && (
            <div className="pt-2">
              <button
                onClick={() => saveWs.mutate()}
                disabled={saveWs.isPending}
                className="px-4 py-2 bg-ink text-paper rounded-md text-sm hover:bg-signal transition-colors disabled:opacity-60"
              >
                {saveWs.isPending ? "Saving…" : "Save workspace"}
              </button>
            </div>
          )}
        </div>
      </Reveal>

      <Reveal delay={0.1} className="mt-6 bg-paper-raised hairline rounded-lg p-6">
        <div className="font-mono-caps text-muted-foreground">Profile</div>
        <h2 className="mt-1 font-display text-2xl font-semibold">You</h2>
        <div className="mt-6 grid gap-5">
          <div>
            <label className="font-mono-caps text-muted-foreground">Name</label>
            <div className="mt-1.5 text-ink">{session?.user?.name ?? "—"}</div>
          </div>
          <div>
            <label className="font-mono-caps text-muted-foreground">Email</label>
            <div className="mt-1.5 text-ink">{session?.user?.email ?? "—"}</div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
