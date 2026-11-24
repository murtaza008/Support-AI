"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { SceneFallback } from "./SceneFallback";
import type { HoverInfo } from "./scene/Scene";
import { cn } from "@/lib/utils";

// three.js + R3F live in their own chunk, requested only when the browser is idle.
const Scene = dynamic(() => import("./scene/Scene"), { ssr: false });

const STEPS = [
  {
    label: "Upload",
    title: "Add the help docs you already have",
    body: "PDF, Word, plain text, Markdown, or a page URL. The text is extracted on the server, up to 500,000 characters per document.",
  },
  {
    label: "Split",
    title: "Cut into passages",
    body: "Each document is split at paragraph breaks into passages of about 1,000 characters, overlapping by 150 so an answer is never cut in half.",
  },
  {
    label: "Index",
    title: "Index by meaning, not keywords",
    body: "Every passage gets a 768-number embedding from Gemini and is stored in Postgres with pgvector. No separate vector database.",
  },
  {
    label: "Retrieve",
    title: "Find the passages that match",
    body: "A customer's question is embedded the same way, and the 6 closest passages in your workspace are pulled by cosine distance.",
  },
  {
    label: "Answer",
    title: "Answer from those passages, with sources",
    body: "The reply is written only from what was retrieved and numbers its sources [1], [2]. If the docs don't cover it, the assistant says so.",
  },
] as const;

const noop = () => () => {};
function useWebGL() {
  return useSyncExternalStore(
    noop,
    () => {
      try {
        const c = document.createElement("canvas");
        return !!(c.getContext("webgl2") ?? c.getContext("webgl"));
      } catch {
        return false;
      }
    },
    () => true,
  );
}
function useReducedMotion() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

export function Story() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const [step, setStep] = useState(0);
  const [load, setLoad] = useState(false);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(false);
  const [tip, setTip] = useState<(NonNullable<HoverInfo> & { w: number }) | null>(null);
  const webgl = useWebGL();
  const reducedMotion = useReducedMotion();

  // Scroll progress through the section, 0..4 (one unit per stage change).
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const t = Math.min(Math.max(-rect.top / Math.max(total, 1), 0), 1);
      progressRef.current = t * (STEPS.length - 1);
      setStep(Math.min(STEPS.length - 1, Math.round(progressRef.current)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  // Render only while on screen.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: "120px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Load the 3D chunk once the browser is idle (the headline has painted by then).
  useEffect(() => {
    if (!webgl) return;
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(() => setLoad(true), { timeout: 2500 });
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(() => setLoad(true), 1200);
    return () => clearTimeout(t);
  }, [webgl]);

  const onReady = useCallback(() => setReady(true), []);
  // Tooltip position relative to the stage, computed in the event handler.
  const onHover = useCallback((info: HoverInfo) => {
    const r = stageRef.current?.getBoundingClientRect();
    if (!info || !r) return setTip(null);
    setTip({ ...info, x: info.x - r.left, y: info.y - r.top, w: r.width });
  }, []);

  return (
    <section ref={sectionRef} id="how-it-works" aria-labelledby="how-title" className="relative">
      <div className="mx-auto grid max-w-6xl gap-x-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
        <div className="sticky top-14 z-10 order-first h-[46svh] border-b border-border bg-bg lg:top-[10vh] lg:order-last lg:h-[80vh] lg:border-0 lg:bg-transparent">
          <div
            ref={stageRef}
            className="pointer-events-none relative h-full w-full lg:pointer-events-auto"
            onPointerLeave={() => setTip(null)}
          >
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center p-6 transition-opacity duration-500",
                ready ? "opacity-0" : "opacity-100",
              )}
            >
              <SceneFallback />
            </div>
            {webgl && load && (
              <div className={cn("absolute inset-0 transition-opacity duration-700", ready ? "opacity-100" : "opacity-0")}>
                <Scene
                  progressRef={progressRef}
                  active={active}
                  reducedMotion={reducedMotion}
                  onHover={onHover}
                  onReady={onReady}
                />
              </div>
            )}
            {tip && (
              <div
                role="tooltip"
                className="panel-raised pointer-events-none absolute z-20 max-w-64 px-3 py-2 text-[12.5px]"
                style={{
                  left: Math.max(0, Math.min(tip.x + 14, tip.w - 260)),
                  top: tip.y + 14,
                }}
              >
                <p className="font-medium text-fg">{tip.title}</p>
                <p className="mt-0.5 text-fg-muted">{tip.detail}</p>
              </div>
            )}
          </div>
        </div>

        <div className="relative">
          <div className="pb-6 pt-16 lg:pt-[18vh]">
            <p className="eyebrow">How it works</p>
            <h2 id="how-title" className="mt-2 text-[30px] font-semibold leading-tight text-fg md:text-[38px]">
              From a folder of help docs to an answer with its source.
            </h2>
          </div>
          <ol className="pb-[30vh]">
            {STEPS.map((s, i) => (
              <li key={s.label} className="flex min-h-[58svh] items-end pb-6 lg:min-h-[78vh] lg:items-center lg:pb-0">
                <div
                  className={cn(
                    "panel w-full p-5 transition-[border-color,box-shadow] duration-300 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none",
                    step === i && "lg:border-transparent",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className={cn(
                        "flex size-7 items-center justify-center rounded-full border font-mono text-[12px] transition-colors duration-300",
                        step === i
                          ? "border-accent bg-accent text-accent-fg"
                          : "border-border-strong text-fg-muted",
                      )}
                    >
                      {i + 1}
                    </span>
                    <span className="eyebrow">{s.label}</span>
                  </div>
                  <h3 className="mt-3 text-[22px] font-semibold leading-snug text-fg md:text-[26px]">{s.title}</h3>
                  <p className="mt-2 max-w-md text-[15.5px] leading-relaxed text-fg-muted">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
