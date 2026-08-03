"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useState } from "react";
import { Users } from "lucide-react";

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
  });

  const accept = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/invites/${token}`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not accept invite");
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
    <div className="min-h-screen bg-paper text-ink flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-paper-raised hairline rounded-xl p-8 text-center"
      >
        <div className="mx-auto size-12 rounded-full bg-signal-dim text-signal flex items-center justify-center">
          <Users className="size-5" />
        </div>

        {isLoading && (
          <p className="mt-5 font-mono-caps text-muted-foreground animate-pulse">
            Loading invite…
          </p>
        )}

        {!isLoading && !invite && (
          <>
            <h1 className="mt-5 font-display text-2xl font-semibold">Invite not found.</h1>
            <p className="mt-2 text-muted-foreground">
              This link may have been revoked or never existed.
            </p>
          </>
        )}

        {!isLoading && invite && (invite.accepted || invite.expired) && (
          <>
            <h1 className="mt-5 font-display text-2xl font-semibold">
              {invite.accepted ? "Already used." : "Invite expired."}
            </h1>
            <p className="mt-2 text-muted-foreground">
              Ask an admin at {invite.workspaceName} to send a new invite link.
            </p>
          </>
        )}

        {!isLoading && invite && !invite.accepted && !invite.expired && (
          <>
            <div className="mt-5 font-mono-caps text-signal">You&rsquo;re invited</div>
            <h1
              className="mt-2 font-display text-3xl font-semibold"
              style={{ letterSpacing: "-0.02em" }}
            >
              Join {invite.workspaceName}
            </h1>
            <p className="mt-2 text-muted-foreground">
              As {invite.role.toLowerCase()} · {invite.email}
            </p>

            {err && <p className="mt-4 text-sm text-destructive">{err}</p>}

            {status === "authenticated" ? (
              <button
                onClick={() => accept.mutate()}
                disabled={accept.isPending}
                className="mt-6 w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-signal text-white rounded-md font-medium hover:bg-[#e84a26] transition-colors disabled:opacity-60"
              >
                {accept.isPending
                  ? "Joining…"
                  : `Accept as ${session?.user?.email ?? "you"} →`}
              </button>
            ) : (
              <div className="mt-6 flex flex-col gap-2">
                <button
                  onClick={() => goAuth("signup")}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-signal text-white rounded-md font-medium hover:bg-[#e84a26] transition-colors"
                >
                  Create an account →
                </button>
                <button
                  onClick={() => goAuth("login")}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-ink hairline rounded-md font-medium hover:bg-paper transition-colors"
                >
                  Sign in
                </button>
              </div>
            )}
          </>
        )}

        <Link
          href="/"
          className="mt-6 inline-block text-sm text-muted-foreground hover:text-ink"
        >
          ← Back to SupportAI
        </Link>
      </motion.div>
    </div>
  );
}
