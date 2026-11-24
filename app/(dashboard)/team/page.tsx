"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import * as D from "@radix-ui/react-dialog";
import { duration, timeAgo } from "@/lib/time";
import { toast } from "sonner";
import { Check, Copy, Link2, Mail, Trash2, UserMinus, Users } from "lucide-react";
import { useCurrentWorkspace } from "@/lib/hooks/use-current-workspace";
import { q, type InviteRow, type MemberRow, type Role } from "@/lib/queries";
import { initials } from "@/components/dashboard/UserMenu";
import { Button } from "@/components/ui/button";
import { DialogContent } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/form";
import { HoverCard, HoverStats } from "@/components/ui/hover-card";
import { Badge, EmptyState, PageHeader, Panel, PanelHeader, Skeleton, staggerStyle } from "@/components/ui/primitives";

const roleLabel: Record<Role, string> = { OWNER: "Owner", ADMIN: "Admin", MEMBER: "Member" };

/** What each role can do, as enforced by the API routes. */
const PERMISSIONS: { label: string; roles: Role[] }[] = [
  { label: "Chat in the playground, read conversations and analytics", roles: ["OWNER", "ADMIN", "MEMBER"] },
  { label: "Create and edit assistants, add and delete documents", roles: ["OWNER", "ADMIN", "MEMBER"] },
  { label: "Delete assistants", roles: ["OWNER", "ADMIN"] },
  { label: "Invite people, change roles, remove members", roles: ["OWNER", "ADMIN"] },
  { label: "Workspace settings and billing", roles: ["OWNER", "ADMIN"] },
];

async function call(url: string, init: RequestInit, fallback: string) {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? fallback);
  }
  return res.json().catch(() => ({}));
}

export default function TeamPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const { data: ws } = useCurrentWorkspace();
  const { data: session } = useSession();
  const wsId = ws?.id ?? "";
  const canManage = ws?.role === "OWNER" || ws?.role === "ADMIN";
  const myId = session?.user?.id;

  const { data: members, isLoading } = useQuery({ ...q.members(wsId), enabled: !!ws });
  const { data: invites } = useQuery({ ...q.invites(wsId), enabled: !!ws });

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [justCreated, setJustCreated] = useState<InviteRow | null>(null);
  const [removing, setRemoving] = useState<MemberRow | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [now] = useState(() => new Date());

  const invalidate = (key: "members" | "invites") => {
    qc.invalidateQueries({ queryKey: [key, wsId] });
    qc.invalidateQueries({ queryKey: ["summary", wsId] });
  };

  const createInvite = useMutation({
    mutationFn: () =>
      call(
        `/api/workspaces/${wsId}/invites`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim().toLowerCase(), role }) },
        "Could not create the invite",
      ) as Promise<InviteRow>,
    onSuccess: (invite) => {
      setJustCreated(invite);
      setEmail("");
      invalidate("invites");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revoke = useMutation({
    mutationFn: (id: string) => call(`/api/workspaces/${wsId}/invites/${id}`, { method: "DELETE" }, "Could not revoke the invite"),
    onSuccess: () => {
      toast.success("Invite revoked");
      invalidate("invites");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateRole = useMutation({
    mutationFn: ({ id, r }: { id: string; r: "ADMIN" | "MEMBER" }) =>
      call(
        `/api/workspaces/${wsId}/members/${id}`,
        { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: r }) },
        "Could not change the role",
      ),
    onSuccess: () => {
      toast.success("Role updated");
      invalidate("members");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (m: MemberRow) => call(`/api/workspaces/${wsId}/members/${m.id}`, { method: "DELETE" }, "Could not remove the member"),
    onSuccess: (_d, m) => {
      setRemoving(null);
      if (m.userId === myId) {
        toast.success("You left the workspace");
        qc.clear();
        router.push("/onboarding");
        return;
      }
      toast.success("Member removed");
      invalidate("members");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const link = (token: string) => `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${token}`;
  async function copyLink(token: string) {
    try {
      await navigator.clipboard.writeText(link(token));
      setCopied(token);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      toast.error("Copy failed. Select the link and copy it manually.");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <PageHeader
        eyebrow="Team"
        title="People in this workspace"
        description={members ? `${members.length} ${members.length === 1 ? "member" : "members"} · ${invites?.length ?? 0} pending invites` : "Loading the team…"}
      />

      <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          {canManage && (
            <Panel>
              <PanelHeader title="Invite someone" description="They get a link to join. Links expire after 14 days." />
              <form
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  setJustCreated(null);
                  createInvite.mutate();
                }}
                className="flex flex-col gap-3 px-5 pb-5 pt-4 sm:flex-row sm:items-end"
              >
                <Field label="Email" htmlFor="invite-email" className="flex-1">
                  <Input id="invite-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@company.com" />
                </Field>
                <Field label="Role" htmlFor="invite-role" className="sm:w-36">
                  <Select id="invite-role" value={role} onChange={(e) => setRole(e.target.value as "ADMIN" | "MEMBER")}>
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                  </Select>
                </Field>
                <Button type="submit" variant="primary" disabled={createInvite.isPending}>
                  <Mail /> {createInvite.isPending ? "Creating…" : "Create invite"}
                </Button>
              </form>
              {justCreated && (
                <div className="mx-5 mb-5 flex flex-col gap-2 rounded-md border border-success/40 bg-success-soft p-3 sm:flex-row sm:items-center">
                  <p className="min-w-0 flex-1 text-[13px] text-success-text">
                    Invite for <strong>{justCreated.email}</strong> is ready. Send them this link:
                    <span className="mt-1 block truncate font-mono text-[12px]">{link(justCreated.token)}</span>
                  </p>
                  <Button size="sm" variant="secondary" onClick={() => copyLink(justCreated.token)}>
                    {copied === justCreated.token ? <Check /> : <Copy />} {copied === justCreated.token ? "Copied" : "Copy link"}
                  </Button>
                </div>
              )}
            </Panel>
          )}

          <Panel>
            <PanelHeader title="Members" />
            <div className="px-2 pb-2 pt-2">
              {isLoading ? (
                <div className="space-y-2 px-3 pb-2">
                  {Array.from({ length: 3 }, (_, i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : (
                <ul className="stagger" aria-label="Members">
                  {(members ?? []).map((m, i) => {
                    const name = m.user.displayName ?? m.user.email.split("@")[0];
                    const isMe = m.userId === myId;
                    const editable = canManage && m.role !== "OWNER" && !isMe;
                    return (
                      <li key={m.id} style={staggerStyle(i)} className="flex items-center gap-3 rounded-md px-3 py-2.5 hover:bg-surface-2">
                        <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2 text-[12px] font-semibold text-fg">
                          {initials(name)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <HoverCard
                            delay="long"
                            trigger={
                              <span tabIndex={0} className="block truncate text-[14px] font-medium text-fg outline-none">
                                {name}
                                {isMe && <span className="font-normal text-fg-muted"> (you)</span>}
                              </span>
                            }
                          >
                            <p className="font-medium">{name}</p>
                            <p className="mt-0.5 truncate text-[12.5px] text-fg-muted">{m.user.email}</p>
                            <HoverStats
                              rows={[
                                { label: "Role", value: roleLabel[m.role] },
                                { label: "Joined", value: new Date(m.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" }) },
                                { label: "Member for", value: duration(new Date(m.createdAt)) },
                              ]}
                            />
                          </HoverCard>
                          <p className="truncate text-[12.5px] text-fg-muted">{m.user.email}</p>
                        </div>
                        {editable ? (
                          <Select
                            aria-label={`Role for ${name}`}
                            value={m.role}
                            onChange={(e) => updateRole.mutate({ id: m.id, r: e.target.value as "ADMIN" | "MEMBER" })}
                            className="w-28"
                          >
                            <option value="MEMBER">Member</option>
                            <option value="ADMIN">Admin</option>
                          </Select>
                        ) : (
                          <Badge tone={m.role === "OWNER" ? "accent" : "neutral"}>{roleLabel[m.role]}</Badge>
                        )}
                        {(editable || (isMe && m.role !== "OWNER")) && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={isMe ? "Leave workspace" : `Remove ${name}`}
                            onClick={() => setRemoving(m)}
                          >
                            <UserMinus />
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Pending invites" />
            <div className="px-2 pb-2 pt-2">
              {(invites ?? []).length === 0 ? (
                <EmptyState
                  icon={<Users />}
                  title="No pending invites"
                  description={canManage ? "Invite a teammate above; their link shows up here until they join." : "Owners and admins can invite people."}
                  className="py-8"
                />
              ) : (
                <ul aria-label="Pending invites">
                  {(invites ?? []).map((inv) => {
                    const expired = new Date(inv.expiresAt).getTime() < now.getTime();
                    return (
                      <li key={inv.id} className="flex flex-wrap items-center gap-3 rounded-md px-3 py-2.5 hover:bg-surface-2">
                        <Mail aria-hidden className="size-4 shrink-0 text-fg-subtle" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] text-fg">{inv.email}</p>
                          <p className="text-[12.5px] text-fg-muted">
                            {roleLabel[inv.role]} ·{" "}
                            {expired ? "Expired" : `expires ${timeAgo(new Date(inv.expiresAt))}`}
                          </p>
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => copyLink(inv.token)} disabled={expired}>
                          {copied === inv.token ? <Check /> : <Link2 />} {copied === inv.token ? "Copied" : "Copy link"}
                        </Button>
                        {canManage && (
                          <Button variant="ghost" size="icon-sm" aria-label={`Revoke invite for ${inv.email}`} onClick={() => revoke.mutate(inv.id)}>
                            <Trash2 />
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </Panel>
        </div>

        <Panel className="h-fit">
          <PanelHeader title="What each role can do" />
          <div className="overflow-x-auto px-5 pb-5 pt-3">
            <table className="w-full text-[13px]">
              <caption className="sr-only">Permissions by role</caption>
              <thead>
                <tr className="text-left text-[12px] text-fg-muted">
                  <th scope="col" className="pb-2 font-medium">Can</th>
                  <th scope="col" className="w-14 px-1.5 pb-2 text-center font-medium">Owner</th>
                  <th scope="col" className="w-14 px-1.5 pb-2 text-center font-medium">Admin</th>
                  <th scope="col" className="w-16 px-1.5 pb-2 text-center font-medium">Member</th>
                </tr>
              </thead>
              <tbody>
                {PERMISSIONS.map((p) => (
                  <tr key={p.label} className="border-t border-border">
                    <th scope="row" className="py-2 pr-2 text-left font-normal text-fg">{p.label}</th>
                    {(["OWNER", "ADMIN", "MEMBER"] as Role[]).map((r) => (
                      <td key={r} className="px-1.5 py-2 text-center">
                        {p.roles.includes(r) ? (
                          <>
                            <Check aria-hidden className="mx-auto size-4 text-success-text" />
                            <span className="sr-only">Yes</span>
                          </>
                        ) : (
                          <>
                            <span aria-hidden className="text-fg-subtle">—</span>
                            <span className="sr-only">No</span>
                          </>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-[12.5px] text-fg-muted">Anyone except the owner can leave the workspace.</p>
          </div>
        </Panel>
      </div>

      <D.Root open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        {removing && (
          <DialogContent
            title={removing.userId === myId ? "Leave this workspace?" : `Remove ${removing.user.displayName ?? removing.user.email}?`}
            description={
              removing.userId === myId
                ? "You lose access to its assistants, documents and conversations. An admin can invite you back."
                : "They lose access right away. Their past conversations and documents stay."
            }
          >
            <div className="flex justify-end gap-2 px-5 py-4">
              <D.Close asChild>
                <Button variant="secondary">Cancel</Button>
              </D.Close>
              <Button variant="danger" onClick={() => remove.mutate(removing)} disabled={remove.isPending}>
                <UserMinus /> {removing.userId === myId ? "Leave workspace" : "Remove member"}
              </Button>
            </div>
          </DialogContent>
        )}
      </D.Root>
    </div>
  );
}
