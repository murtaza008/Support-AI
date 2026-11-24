"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, CreditCard, ExternalLink, Lock } from "lucide-react";
import { useCurrentWorkspace } from "@/lib/hooks/use-current-workspace";
import { EVERY_PLAN, PLANS, type PlanKey } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Badge, PageHeader, Panel, Skeleton, staggerStyle } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const ORDER: PlanKey[] = ["STARTER", "PRO", "AGENCY"];

async function post<T>(url: string, body: unknown, fallback: string): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { error?: string }).error ?? fallback);
  return json as T;
}

export default function BillingPage() {
  const qc = useQueryClient();
  const { data: ws } = useCurrentWorkspace();
  const canManage = ws?.role === "OWNER" || ws?.role === "ADMIN";
  const current = PLANS.find((p) => p.key === ws?.plan) ?? PLANS[0];

  const checkout = useMutation({
    mutationFn: (plan: "PRO" | "AGENCY") =>
      post<{ demo?: boolean; url?: string }>("/api/billing/checkout", { workspaceId: ws!.id, plan }, "Checkout failed"),
    onSuccess: (result) => {
      if (result.url) {
        window.location.href = result.url;
        return;
      }
      toast.success("Plan changed. Billing is in demo mode, so nothing was charged.");
      qc.invalidateQueries({ queryKey: ["current-workspace"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const portal = useMutation({
    mutationFn: () => post<{ url: string }>("/api/billing/portal", { workspaceId: ws!.id }, "Could not open the billing portal"),
    onSuccess: (result) => {
      window.location.href = result.url;
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <PageHeader eyebrow="Billing" title="Plan and billing" description="Every plan includes the whole product. Plans differ in how much you can store and answer." />

      <Panel className="mt-8 flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        {!ws ? (
          <Skeleton className="h-12 w-full" />
        ) : (
          <>
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-text">
              <CreditCard aria-hidden className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] text-fg-muted">Current plan</p>
              <p className="text-[19px] font-semibold text-fg">
                {current.name}
                <span className="ml-2 text-[14px] font-normal text-fg-muted">
                  {current.price === 0 ? "Free" : `$${current.price} per month`}
                </span>
              </p>
              <p className="mt-0.5 text-[13px] text-fg-muted">{Object.values(current.limits).join(" · ")}</p>
            </div>
            {canManage && ws.plan !== "STARTER" && (
              <Button variant="secondary" onClick={() => portal.mutate()} disabled={portal.isPending}>
                <ExternalLink /> {portal.isPending ? "Opening…" : "Invoices and payment"}
              </Button>
            )}
          </>
        )}
      </Panel>

      {ws && !canManage && (
        <p className="mt-4 flex items-center gap-2 text-[13px] text-fg-muted">
          <Lock aria-hidden className="size-4" /> Only owners and admins can change the plan.
        </p>
      )}

      <ul className="stagger mt-6 grid gap-4 md:grid-cols-3">
        {PLANS.map((p, i) => {
          const isCurrent = ws?.plan === p.key;
          const isUpgrade = ws ? ORDER.indexOf(p.key) > ORDER.indexOf(ws.plan) : false;
          return (
            <li
              key={p.key}
              style={staggerStyle(i)}
              className={cn("panel flex flex-col p-6", isCurrent && "border-accent shadow-[inset_0_0_0_1px_var(--accent)]")}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-[17px] font-semibold text-fg">{p.name}</h2>
                {isCurrent && <Badge tone="accent">Current plan</Badge>}
              </div>
              <p className="mt-1 text-[13.5px] text-fg-muted">{p.summary}</p>
              <p className="mt-5 flex items-baseline gap-1.5">
                <span className="tabular font-display text-[36px] font-semibold leading-none text-fg">
                  {p.price === 0 ? "Free" : `$${p.price}`}
                </span>
                {p.price > 0 && <span className="text-[13px] text-fg-muted">per month</span>}
              </p>
              <ul className="mt-6 flex-1 space-y-2 text-[14px] text-fg">
                {Object.values(p.limits).map((l) => (
                  <li key={l} className="flex gap-2">
                    <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-accent-text" />
                    {l}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                {isCurrent ? (
                  <Button variant="secondary" className="w-full" disabled>
                    Your plan
                  </Button>
                ) : isUpgrade ? (
                  <Button
                    variant="primary"
                    className="w-full"
                    disabled={!canManage || checkout.isPending}
                    onClick={() => checkout.mutate(p.key as "PRO" | "AGENCY")}
                  >
                    Upgrade to {p.name}
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    className="w-full"
                    disabled={!canManage || portal.isPending}
                    onClick={() => (p.key === "STARTER" ? portal.mutate() : checkout.mutate(p.key as "PRO" | "AGENCY"))}
                  >
                    {p.key === "STARTER" ? "Downgrade in the billing portal" : `Switch to ${p.name}`}
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 text-[13.5px] text-fg-muted">On every plan: {EVERY_PLAN.join(" · ")}.</p>
    </div>
  );
}
