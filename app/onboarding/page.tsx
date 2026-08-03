"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useCurrentWorkspace } from "@/lib/hooks/use-current-workspace";

export default function OnboardingPage() {
  const router = useRouter();
  const { data: ws, isLoading } = useCurrentWorkspace();
  const [step, setStep] = useState<1 | 2>(1);
  const [workspaceName, setWorkspaceName] = useState("");
  const [assistantName, setAssistantName] = useState("");
  const [tone, setTone] = useState("friendly");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && ws) router.push("/dashboard");
  }, [isLoading, ws, router]);

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
        throw new Error(body.error ?? "Could not create workspace.");
      }
      const workspace = await res.json();
      setWorkspaceId(workspace.id);
      setStep(2);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not create workspace.");
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
        throw new Error(body.error ?? "Could not create assistant.");
      }
      router.push("/dashboard");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not create assistant.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col">
      <header className="border-b border-line">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-2">
          <div className="size-7 rounded-md bg-ink flex items-center justify-center text-paper text-sm">
            ✦
          </div>
          <span className="font-display text-lg font-semibold">SupportAI</span>
          <div className="ml-auto font-mono-caps text-muted-foreground">
            Step 0{step} / 02
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-lg"
        >
          {step === 1 ? (
            <form onSubmit={submitWorkspace}>
              <div className="font-mono-caps text-signal mb-3">Workspace</div>
              <h1
                className="font-display text-4xl md:text-5xl font-semibold leading-tight"
                style={{ letterSpacing: "-0.02em" }}
              >
                Name your workspace.
              </h1>
              <p className="mt-3 text-muted-foreground">
                This is where you&rsquo;ll organize assistants, docs, and teammates.
              </p>
              <input
                autoFocus
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="Acme Support"
                required
                minLength={2}
                className="mt-8 w-full px-4 py-3 bg-paper-raised hairline rounded-md text-lg focus:border-signal focus:outline-none"
              />
              {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
              <button
                type="submit"
                disabled={loading}
                className="mt-6 inline-flex items-center gap-2 px-5 py-3 bg-signal text-white rounded-md font-medium hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-8px_rgba(255,90,54,0.5)] transition-all disabled:opacity-60"
              >
                {loading ? "Creating…" : "Continue →"}
              </button>
            </form>
          ) : (
            <form onSubmit={submitAssistant}>
              <div className="font-mono-caps text-signal mb-3">First assistant</div>
              <h1
                className="font-display text-4xl md:text-5xl font-semibold leading-tight"
                style={{ letterSpacing: "-0.02em" }}
              >
                Meet your new agent.
              </h1>
              <p className="mt-3 text-muted-foreground">
                We&rsquo;ll wire it up to your docs in the next step.
              </p>

              <label className="block mt-8">
                <span className="font-mono-caps text-muted-foreground">Name</span>
                <input
                  autoFocus
                  value={assistantName}
                  onChange={(e) => setAssistantName(e.target.value)}
                  placeholder="Support Bot"
                  required
                  minLength={2}
                  className="mt-1.5 w-full px-4 py-3 bg-paper-raised hairline rounded-md focus:border-signal focus:outline-none"
                />
              </label>

              <label className="block mt-5">
                <span className="font-mono-caps text-muted-foreground">Tone</span>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {["friendly", "professional", "playful"].map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setTone(t)}
                      className={`px-3 py-2.5 rounded-md text-sm capitalize transition-all ${
                        tone === t
                          ? "bg-ink text-paper"
                          : "bg-paper-raised hairline hover:border-ink/40"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </label>

              {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
              <button
                type="submit"
                disabled={loading}
                className="mt-8 inline-flex items-center gap-2 px-5 py-3 bg-signal text-white rounded-md font-medium hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-8px_rgba(255,90,54,0.5)] transition-all disabled:opacity-60"
              >
                {loading ? "Creating…" : "Enter dashboard →"}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
