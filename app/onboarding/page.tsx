"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentWorkspace } from "@/lib/hooks/use-current-workspace";
import { CenteredPage } from "@/components/layout/CenteredPage";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Segmented } from "@/components/ui/segmented";
import { cn } from "@/lib/utils";

type Tone = "friendly" | "professional" | "playful";

export default function OnboardingPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: ws, isLoading } = useCurrentWorkspace();
  const [step, setStep] = useState<1 | 2>(1);
  const [workspaceName, setWorkspaceName] = useState("");
  const [assistantName, setAssistantName] = useState("");
  const [tone, setTone] = useState<Tone>("friendly");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  // People who already have a workspace go straight to it.
  useEffect(() => {
    if (!isLoading && ws && !workspaceId) router.push("/dashboard");
  }, [isLoading, ws, workspaceId, router]);

  async function submitWorkspace(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: workspaceName.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not create the workspace.");
      }
      const workspace = await res.json();
      setWorkspaceId(workspace.id);
      setStep(2);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not create the workspace.");
    } finally {
      setLoading(false);
    }
  }

  async function submitAssistant(e: FormEvent) {
    e.preventDefault();
    if (!workspaceId) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/assistants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, name: assistantName.trim(), tone }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not create the assistant.");
      }
      await qc.invalidateQueries({ queryKey: ["current-workspace"] });
      router.push("/knowledge");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not create the assistant.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <CenteredPage aside={<span className="text-[13px] text-fg-muted">Step {step} of 2</span>}>
      <ol aria-label="Setup steps" className="mb-6 flex gap-2">
        {[1, 2].map((n) => (
          <li
            key={n}
            aria-current={step === n ? "step" : undefined}
            className={cn("h-1 flex-1 rounded-full transition-colors duration-300", n <= step ? "bg-accent" : "bg-sunken")}
          >
            <span className="sr-only">
              Step {n}: {n === 1 ? "Name your workspace" : "Create your first assistant"}
              {n < step ? " (done)" : ""}
            </span>
          </li>
        ))}
      </ol>

      <div className="panel p-6 sm:p-8">
        {step === 1 ? (
          <form onSubmit={submitWorkspace} key="ws">
            <h1 className="text-[24px] font-semibold leading-tight text-fg">Name your workspace</h1>
            <p className="mt-2 text-[14.5px] text-fg-muted">
              Usually your company or product. Teammates you invite join this workspace.
            </p>
            <Field label="Workspace name" htmlFor="ob-ws" className="mt-6">
              <Input id="ob-ws" autoFocus required maxLength={80} value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} placeholder="Acme Support" />
            </Field>
            {err && <p role="alert" className="mt-4 rounded-md border border-danger-text/30 bg-danger-soft px-3 py-2 text-[13px] text-danger-text">{err}</p>}
            <Button type="submit" variant="primary" size="lg" className="mt-6 w-full" disabled={loading || !workspaceName.trim()}>
              {loading ? "Creating…" : "Continue"}
            </Button>
          </form>
        ) : (
          <form onSubmit={submitAssistant} key="assistant">
            <h1 className="text-[24px] font-semibold leading-tight text-fg">Create your first assistant</h1>
            <p className="mt-2 text-[14.5px] text-fg-muted">
              It answers customer questions from the documents you add next. You can change all of this later.
            </p>
            <Field label="Assistant name" htmlFor="ob-name" className="mt-6">
              <Input id="ob-name" autoFocus required minLength={2} maxLength={80} value={assistantName} onChange={(e) => setAssistantName(e.target.value)} placeholder="Help centre assistant" />
            </Field>
            <div className="mt-5 space-y-1.5">
              <span className="block text-[13px] font-medium text-fg">Tone</span>
              <Segmented
                label="Tone"
                value={tone}
                onChange={setTone}
                options={[
                  { value: "friendly", label: "Friendly" },
                  { value: "professional", label: "Professional" },
                  { value: "playful", label: "Playful" },
                ]}
              />
            </div>
            {err && <p role="alert" className="mt-4 rounded-md border border-danger-text/30 bg-danger-soft px-3 py-2 text-[13px] text-danger-text">{err}</p>}
            <Button type="submit" variant="primary" size="lg" className="mt-6 w-full" disabled={loading || assistantName.trim().length < 2}>
              {loading ? "Creating…" : "Create and add documents"}
            </Button>
          </form>
        )}
      </div>
    </CenteredPage>
  );
}
