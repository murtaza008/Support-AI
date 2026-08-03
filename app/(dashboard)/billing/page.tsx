"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { useCurrentWorkspace } from "@/lib/hooks/use-current-workspace";
import { Reveal } from "@/components/motion/Reveal";

const PLANS = [
  {
    key: "STARTER" as const,
    name: "Starter",
    price: 0,
    tagline: "Kick the tires. Free forever.",
    features: ["1 assistant", "10 documents", "500 messages / month", "Community support"],
    highlight: false,
  },
  {
    key: "PRO" as const,
    name: "Pro",
    price: 79,
    tagline: "Most teams pick this one.",
    features: [
      "5 assistants",
      "50 documents",
      "10,000 messages / month",
      "Remove SupportAI branding",
      "Priority support",
    ],
    highlight: true,
  },
  {
    key: "AGENCY" as const,
    name: "Agency",
    price: 199,
    tagline: "Multi-client, white-label, unlimited.",
    features: [
      "Unlimited assistants",
      "200 documents per assistant",
      "50,000 messages / month",
      "Custom domains",
      "Dedicated CSM",
    ],
    highlight: false,
  },
];

export default function BillingPage() {
  const qc = useQueryClient();
  const { data: ws } = useCurrentWorkspace();
  const canManage = ws?.role === "OWNER" || ws?.role === "ADMIN";

  const checkout = useMutation({
    mutationFn: async (plan: "PRO" | "AGENCY") => {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: ws!.id, plan }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Checkout failed");
      return body as { demo?: boolean; url?: string };
    },
    onSuccess: (result) => {
      if (result.url) {
        window.location.href = result.url;
        return;
      }
      toast.success("Upgraded in demo mode — add Stripe test keys for a real checkout.");
      qc.invalidateQueries({ queryKey: ["current-workspace"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const portal = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: ws!.id }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not open billing portal");
      return body as { url: string };
    },
    onSuccess: (result) => {
      window.location.href = result.url;
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="max-w-6xl mx-auto px-8 py-10">
      <Reveal>
        <div className="font-mono-caps text-signal">Billing</div>
        <h1
          className="mt-2 font-display text-4xl md:text-5xl font-semibold"
          style={{ letterSpacing: "-0.02em" }}
        >
          Plans that scale with you.
        </h1>
        <p className="mt-3 text-muted-foreground text-lg">
          Every plan includes RAG, citations, embed widget, and analytics.
        </p>
      </Reveal>

      <div className="mt-10 grid md:grid-cols-3 gap-5 items-stretch">
        {PLANS.map((p, i) => {
          const isCurrent = ws?.plan === p.key;
          return (
            <Reveal
              key={p.key}
              delay={i * 0.06}
              className={`relative h-full rounded-lg p-7 transition-all duration-200 ${
                p.highlight
                  ? "bg-paper-raised border-2 border-signal shadow-[0_24px_60px_-30px_rgba(255,90,54,0.45)]"
                  : "bg-paper-raised hairline"
              }`}
            >
              {p.highlight && (
                <div className="absolute -top-3 left-7 font-mono-caps text-signal bg-paper-raised px-2 py-0.5 border border-signal rounded">
                  Most popular
                </div>
              )}
              <h3 className="font-display text-2xl font-semibold text-ink">{p.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-display text-5xl font-semibold text-ink tracking-tight">
                  {p.price === 0 ? "Free" : `$${p.price}`}
                </span>
                {p.price !== 0 && (
                  <span className="font-mono text-sm text-muted-foreground">/ MO</span>
                )}
              </div>
              <ul className="mt-6 space-y-3 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-ink">
                    <span className="text-moss mt-0.5">
                      <Check className="size-3.5" />
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <div className="mt-8 w-full inline-flex items-center justify-center px-4 py-2.5 rounded-md font-medium bg-moss-dim text-moss text-sm">
                  Current plan
                </div>
              ) : (
                <button
                  disabled={!canManage || p.key === "STARTER" || checkout.isPending}
                  onClick={() => checkout.mutate(p.key as "PRO" | "AGENCY")}
                  className={`mt-8 w-full inline-flex items-center justify-center px-4 py-2.5 rounded-md font-medium transition-colors duration-150 disabled:opacity-50 ${
                    p.highlight
                      ? "bg-signal text-white hover:bg-[#e84a26]"
                      : "bg-ink text-paper hover:bg-signal"
                  }`}
                >
                  {p.key === "STARTER" ? "Downgrade in portal" : "Upgrade"}
                </button>
              )}
            </Reveal>
          );
        })}
      </div>

      {canManage && ws && ws.plan !== "STARTER" && (
        <div className="mt-8">
          <button
            onClick={() => portal.mutate()}
            disabled={portal.isPending}
            className="text-sm text-signal font-medium hover:underline"
          >
            Manage billing & invoices →
          </button>
        </div>
      )}
    </div>
  );
}
