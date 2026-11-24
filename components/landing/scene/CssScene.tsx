"use client";

import { useEffect, useRef, type CSSProperties, type RefObject } from "react";
import {
  RETRIEVED,
  TILE_COUNT,
  TILE_H,
  TILE_W,
  answerVisibility,
  questionVisibility,
  tileAt,
  tileDim,
  tileHighlight,
} from "./layouts";
import { ANSWER_LINES, QUESTION, tileInfo } from "./content";

export type HoverInfo = { x: number; y: number; title: string; detail: string } | null;

type Props = {
  /** Target scroll progress in [0, 4]; written by the page, read every frame. */
  progressRef: RefObject<number>;
  active: boolean;
  reducedMotion: boolean;
  onHover: (info: HoverInfo) => void;
};

/** World units the stage must fit, like a camera framing the scene. */
const HALF_W = 2.5;
const HALF_H = 2.25;

const fmt = (n: number) => n.toFixed(2);

/**
 * The landing story in real 3D with CSS transforms (perspective +
 * preserve-3d): works in every browser, no WebGL or GPU driver needed.
 * 96 tiles (one per document chunk) move through the five stages as you
 * scroll; positions come from layouts.ts. Updated in a rAF loop outside
 * React, only while on screen.
 */
export default function CssScene({ progressRef, active, reducedMotion, onHover }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef<(HTMLDivElement | null)[]>([]);
  const questionRef = useRef<HTMLDivElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);
  const state = useRef({ progress: 0, rx: 0, ry: 0, px: 0, py: 0, unit: 120, frame: 0 });

  // Size: one world unit in pixels, so the whole stage fits the box.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const unit = Math.max(40, Math.min(width / (2 * HALF_W), height / (2 * HALF_H)));
      state.current.unit = unit;
      worldRef.current?.style.setProperty("--u", `${unit}px`);
      state.current.frame = 0; // force a redraw
      draw();
    });
    ro.observe(stage);
    state.current.progress = progressRef.current ?? 0;
    return () => ro.disconnect();
    // draw is stable (reads refs only)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function draw() {
    const s = state.current;
    const u = s.unit;
    const p = s.progress;
    for (let i = 0; i < TILE_COUNT; i++) {
      const el = tileRefs.current[i];
      if (!el) continue;
      const t = tileAt(i, p);
      el.style.transform =
        `translate3d(${fmt(t.p[0] * u)}px, ${fmt(-t.p[1] * u)}px, ${fmt(t.p[2] * u)}px) ` +
        `rotateX(${fmt(-t.r[0])}rad) rotateY(${fmt(t.r[1])}rad) rotateZ(${fmt(-t.r[2])}rad) scale(${fmt(t.s)})`;
      const hl = tileHighlight(i, p);
      const dim = tileDim(i, p);
      el.style.setProperty("--hl", fmt(hl));
      el.style.opacity = fmt(1 - dim);
    }
    const qv = questionVisibility(p);
    const av = answerVisibility(p);
    if (questionRef.current) {
      const y = 0.1 + av * 1.2;
      questionRef.current.style.opacity = fmt(qv);
      questionRef.current.style.visibility = qv > 0.01 ? "visible" : "hidden";
      questionRef.current.style.transform = `translate3d(0, ${fmt(-y * u)}px, ${fmt(1.0 * u)}px) scale(${fmt(0.9 + qv * 0.1 - av * 0.12)})`;
    }
    if (answerRef.current) {
      answerRef.current.style.opacity = fmt(av);
      answerRef.current.style.visibility = av > 0.01 ? "visible" : "hidden";
      answerRef.current.style.transform = `translate3d(0, ${fmt(-0.12 * u)}px, ${fmt(1.0 * u)}px) scale(${fmt(0.92 + av * 0.08)})`;
    }
    if (worldRef.current) {
      worldRef.current.style.transform = `rotateX(${fmt(s.rx)}deg) rotateY(${fmt(s.ry)}deg)`;
    }
  }

  // Animation loop: eases toward the scroll position and the pointer.
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = state.current;
      const target = progressRef.current ?? 0;
      const k = reducedMotion ? 1 : 1 - Math.exp(-dt * 7);
      const kp = reducedMotion ? 1 : 1 - Math.exp(-dt * 4);
      const moved =
        Math.abs(target - s.progress) > 0.0005 ||
        Math.abs(s.px * 9 - s.ry) > 0.01 ||
        Math.abs(-s.py * 5 - s.rx) > 0.01 ||
        s.frame < 2;
      s.progress += (target - s.progress) * k;
      if (!reducedMotion) {
        s.ry += (s.px * 9 - s.ry) * kp;
        s.rx += (-s.py * 5 - s.rx) * kp;
      }
      if (moved) draw();
      s.frame++;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, reducedMotion]);

  function onPointerMove(e: React.PointerEvent) {
    if (e.pointerType !== "mouse") return;
    const r = stageRef.current?.getBoundingClientRect();
    if (!r) return;
    state.current.px = ((e.clientX - r.left) / r.width) * 2 - 1;
    state.current.py = ((e.clientY - r.top) / r.height) * 2 - 1;
  }

  const tileStyle: CSSProperties = {
    width: `calc(var(--u) * ${TILE_W * 0.93})`,
    height: `calc(var(--u) * ${TILE_H * 0.9})`,
    marginLeft: `calc(var(--u) * ${(-TILE_W * 0.93) / 2})`,
    marginTop: `calc(var(--u) * ${(-TILE_H * 0.9) / 2})`,
  };

  return (
    <div
      ref={stageRef}
      aria-hidden
      onPointerMove={onPointerMove}
      onPointerLeave={() => {
        state.current.px = 0;
        state.current.py = 0;
        onHover(null);
      }}
      className="absolute inset-0 overflow-hidden"
      style={{ perspective: "1400px", perspectiveOrigin: "50% 45%" }}
      data-scene="css3d"
    >
      <div
        ref={worldRef}
        className="absolute left-1/2 top-1/2"
        style={{ transformStyle: "preserve-3d", ["--u" as string]: "120px" } as CSSProperties}
      >
        {Array.from({ length: TILE_COUNT }, (_, i) => (
          <div
            key={i}
            ref={(el) => {
              tileRefs.current[i] = el;
            }}
            data-scene-tile={i}
            onPointerEnter={(e) =>
              onHover({ x: e.clientX, y: e.clientY, ...tileInfo(i, Math.round(state.current.progress)) })
            }
            onPointerMove={(e) =>
              onHover({ x: e.clientX, y: e.clientY, ...tileInfo(i, Math.round(state.current.progress)) })
            }
            onPointerLeave={() => onHover(null)}
            className="scene-tile absolute left-0 top-0"
            style={tileStyle}
          />
        ))}

        <div
          ref={questionRef}
          className="scene-card absolute left-0 top-0"
          style={{
            width: "calc(var(--u) * 2.6)",
            marginLeft: "calc(var(--u) * -1.3)",
            marginTop: "calc(var(--u) * -0.33)",
            visibility: "hidden",
          }}
          onPointerEnter={(e) => onHover({ x: e.clientX, y: e.clientY, title: "Customer question", detail: QUESTION })}
          onPointerLeave={() => onHover(null)}
        >
          <p className="scene-card-label">Customer question</p>
          <p className="scene-card-title">{QUESTION}</p>
        </div>

        <div
          ref={answerRef}
          className="scene-card scene-card-answer absolute left-0 top-0"
          style={{
            width: "calc(var(--u) * 2.6)",
            marginLeft: "calc(var(--u) * -1.3)",
            marginTop: "calc(var(--u) * -0.56)",
            visibility: "hidden",
          }}
          onPointerEnter={(e) =>
            onHover({
              x: e.clientX,
              y: e.clientY,
              title: "Answer",
              detail: `Written only from the ${RETRIEVED.length} retrieved chunks. [1] and [2] point at the passages it used.`,
            })
          }
          onPointerLeave={() => onHover(null)}
        >
          <p className="scene-card-label scene-card-label-accent">Answer · 2 sources cited</p>
          <p className="scene-card-body">{ANSWER_LINES.join(" ")}</p>
        </div>
      </div>
    </div>
  );
}
