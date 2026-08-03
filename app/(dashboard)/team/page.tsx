"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Copy, Trash2, Users, Mail, Check } from "lucide-react";
import { useCurrentWorkspace } from "@/lib/hooks/use-current-workspace";
import { Reveal } from "@/components/motion/Reveal";

type Role = "OWNER" | "ADMIN" | "MEMBER";

type MemberRow = {
  id: string;
  userId: string;
  role: Role;
  createdAt: string;
  user: { displayName: string | null; email: string; avatarUrl: string | null };
};

type InviteRow = {
  id: string;
  email: string;
  role: Role;
  token: string;
  expiresAt: string;
};

export default function TeamPage() {
  const qc = useQueryClient();
  const { data: ws } = useCurrentWorkspace();
  const canManage = ws?.role === "OWNER" || ws?.role === "ADMIN";

  const { data: members } = useQuery({
    queryKey: ["members", ws?.id],
    enabled: !!ws,
    queryFn: async (): Promise<MemberRow[]> => {
      const res = await fetch(`/api/workspaces/${ws!.id}/members`);
      if (!res.ok) throw new Error("Failed to load members");
      return res.json();
    },
  });

  const { data: invites } = useQuery({
    queryKey: ["invites", ws?.id],
    enabled: !!ws,
    queryFn: async (): Promise<InviteRow[]> => {
      const res = await fetch(`/api/workspaces/${ws!.id}/invites`);
      if (!res.ok) throw new Error("Failed to load invites");
      return res.json();
    },
  });

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MEMBER">("MEMBER");

  const createInvite = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/workspaces/${ws!.id}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), role }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not create invite");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Invite created");
      setEmail("");
      qc.invalidateQueries({ queryKey: ["invites", ws?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteInvite = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/workspaces/${ws!.id}/invites/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast.success("Invite revoked");
      qc.invalidateQueries({ queryKey: ["invites", ws?.id] });
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ id, r }: { id: string; r: "ADMIN" | "MEMBER" }) => {
      const res = await fetch(`/api/workspaces/${ws!.id}/members/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: r }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not update role");
      }
    },
    onSuccess: () => {
      toast.success("Role updated");
      qc.invalidateQueries({ queryKey: ["members", ws?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMember = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/workspaces/${ws!.id}/members/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast.success("Member removed");
      qc.invalidateQueries({ queryKey: ["members", ws?.id] });
    },
  });

  function inviteLink(token: string) {
    return `${window.location.origin}/invite/${token}`;
  }

  return (
    <div className="max-w-6xl mx-auto px-8 py-10">
      <Reveal>
        <div className="font-mono-caps text-signal">Team</div>
        <h1
          className="mt-2 font-display text-4xl md:text-5xl font-semibold"
          style={{ letterSpacing: "-0.02em" }}
        >
          Your workspace.
        </h1>
      </Reveal>

      {canManage && (
        <Reveal delay={0.05} className="mt-10 bg-paper-raised hairline rounded-lg p-6">
          <div className="font-mono-caps text-muted-foreground">Invite</div>
          <h2 className="mt-1 font-display text-2xl font-semibold">Add a teammate</h2>
          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              createInvite.mutate();
            }}
            className="mt-5 flex flex-col md:flex-row gap-3"
          >
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="email"
                required
                placeholder="teammate@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 h-10 rounded-md hairline bg-paper focus:border-signal focus:outline-none text-sm"
              />
            </div>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "ADMIN" | "MEMBER")}
              className="h-10 px-3 rounded-md hairline bg-paper text-sm"
            >
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button
              type="submit"
              disabled={createInvite.isPending}
              className="px-4 h-10 bg-ink text-paper rounded-md text-sm hover:bg-signal transition-colors disabled:opacity-60"
            >
              {createInvite.isPending ? "Creating…" : "Create invite link"}
            </button>
          </form>
        </Reveal>
      )}

      <Reveal delay={0.1} className="mt-6 bg-paper-raised hairline rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono-caps text-muted-foreground">Members</div>
            <h2 className="mt-1 font-display text-2xl font-semibold">
              {members?.length ?? 0} people
            </h2>
          </div>
          <Users className="size-5 text-ink/30" />
        </div>
        <div className="mt-5 divide-y divide-line">
          {(members ?? []).map((m) => (
            <div key={m.id} className="py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-9 rounded-full bg-ink text-paper flex items-center justify-center text-sm font-medium shrink-0">
                  {(m.user.displayName?.[0] ?? m.user.email[0] ?? "?").toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-ink font-medium truncate">
                    {m.user.displayName ?? m.user.email}
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground uppercase mt-0.5">
                    Joined {new Date(m.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {canManage && m.role !== "OWNER" ? (
                  <select
                    value={m.role}
                    onChange={(e) =>
                      updateRole.mutate({ id: m.id, r: e.target.value as "ADMIN" | "MEMBER" })
                    }
                    className="h-8 px-2 rounded-md hairline bg-paper text-xs"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-signal-dim text-signal font-mono uppercase">
                    {m.role}
                  </span>
                )}
                {canManage && m.role !== "OWNER" && (
                  <button
                    onClick={() => {
                      if (confirm("Remove this member?")) removeMember.mutate(m.id);
                    }}
                    className="p-1.5 rounded-md text-ink/40 hover:text-signal hover:bg-signal-dim transition-colors"
                    aria-label="Remove"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      {canManage && (invites ?? []).length > 0 && (
        <Reveal delay={0.15} className="mt-6 bg-paper-raised hairline rounded-lg p-6">
          <div className="font-mono-caps text-muted-foreground">Pending</div>
          <h2 className="mt-1 font-display text-2xl font-semibold">Open invites</h2>
          <div className="mt-5 divide-y divide-line">
            {invites!.map((i) => (
              <InviteRow
                key={i.id}
                invite={i}
                link={inviteLink(i.token)}
                onRevoke={() => deleteInvite.mutate(i.id)}
              />
            ))}
          </div>
        </Reveal>
      )}
    </div>
  );
}

function InviteRow({
  invite,
  link,
  onRevoke,
}: {
  invite: InviteRow;
  link: string;
  onRevoke: () => void;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="py-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-ink font-medium truncate">{invite.email}</div>
        <div className="font-mono text-[11px] text-muted-foreground uppercase mt-0.5">
          {invite.role.toLowerCase()} · expires{" "}
          {new Date(invite.expiresAt).toLocaleDateString()}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            navigator.clipboard.writeText(link);
            setCopied(true);
            toast.success("Invite link copied");
            setTimeout(() => setCopied(false), 1500);
          }}
          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md hairline hover:bg-paper transition-colors"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy link"}
        </button>
        <button
          onClick={onRevoke}
          className="p-1.5 rounded-md text-ink/40 hover:text-signal hover:bg-signal-dim transition-colors"
          aria-label="Revoke"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
}
