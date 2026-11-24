"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { CenteredPage } from "@/components/layout/CenteredPage";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/primitives";

type InviteInfo = {
  email: string;
  role: string;
  workspaceName: string;
  accepted: boolean;
  expired: boolean;
};

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [err, setErr] = useState<string | null>(null);

  const { data: invite, isLoading } = useQuery({
    queryKey: ["invite", token],
    queryFn: async (): Promise<InviteInfo> => {
      const res = await fetch(`/api/invites/${token}`);
      if (!res.ok) throw new Error("Invite not found");
      return res.json();
    },
    retry: false,
  });

  const accept = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/invites/${token}`, { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Could not accept the invite");
      return body;
    },
    onSuccess: () => router.push("/dashboard"),
    onError: (e: Error) => setErr(e.message),
  });

  function goAuth(mode: "login" | "signup") {
    sessionStorage.setItem("pending_invite_token", token);
    router.push(`/${mode}`);
  }

  return (
    <CenteredPage>
      <div className="panel p-6 text-center sm:p-8">
        <div className="mx-auto flex size-11 items-center justify-center rounded-lg bg-accent-soft text-accent-text">
          <Users aria-hidden className="size-5" />
        </div>

        {isLoading && (
          <div className="mt-5 space-y-3">
            <Skeleton className="mx-auto h-7 w-56" />
            <Skeleton className="mx-auto h-4 w-40" />
          </div>
        )}

        {!isLoading && !invite && (
          <>
            <h1 className="mt-5 text-[22px] font-semibold text-fg">This invite link doesn&rsquo;t work</h1>
            <p className="mt-2 text-[14px] text-fg-muted">It may have been revoked, or the link is incomplete. Ask whoever sent it for a new one.</p>
            <Link href="/" className={buttonVariants({ variant: "secondary", className: "mt-6" })}>
              Go to SupportAI
            </Link>
          </>
        )}

        {!isLoading && invite && (invite.accepted || invite.expired) && (
          <>
            <h1 className="mt-5 text-[22px] font-semibold text-fg">{invite.accepted ? "This invite was already used" : "This invite has expired"}</h1>
            <p className="mt-2 text-[14px] text-fg-muted">Ask an admin at {invite.workspaceName} to send you a new link.</p>
          </>
        )}

        {!isLoading && invite && !invite.accepted && !invite.expired && (
          <>
            <h1 className="mt-5 text-[22px] font-semibold text-fg">Join {invite.workspaceName}</h1>
            <p className="mt-2 text-[14px] text-fg-muted">
              You&rsquo;re invited as {invite.role.toLowerCase()} ({invite.email}).
            </p>
            {err && <p role="alert" className="mt-4 rounded-md border border-danger-text/30 bg-danger-soft px-3 py-2 text-[13px] text-danger-text">{err}</p>}
            {status === "authenticated" ? (
              <Button variant="primary" size="lg" className="mt-6 w-full" onClick={() => accept.mutate()} disabled={accept.isPending}>
                {accept.isPending ? "Joining…" : `Join as ${session?.user?.email ?? "you"}`}
              </Button>
            ) : (
              <div className="mt-6 grid gap-2">
                <Button variant="primary" size="lg" onClick={() => goAuth("signup")} disabled={status === "loading"}>
                  Create an account to join
                </Button>
                <Button variant="secondary" size="lg" onClick={() => goAuth("login")} disabled={status === "loading"}>
                  I already have an account
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </CenteredPage>
  );
}
