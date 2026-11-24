import { describe, expect, it } from "vitest";
import {
  RETRIEVED,
  STAGES,
  TILE_COUNT,
  answerVisibility,
  questionVisibility,
  stageTransform,
  tileAt,
  tileHighlight,
} from "@/components/landing/scene/layouts";
import { tileInfo } from "@/components/landing/scene/content";

describe("landing scene layouts", () => {
  it("lands exactly on each stage layout at integer progress", () => {
    for (let stage = 0; stage < STAGES; stage++) {
      for (const i of [0, 17, 41, TILE_COUNT - 1]) {
        const at = tileAt(i, stage);
        const want = stageTransform(i, stage);
        at.p.forEach((v, k) => expect(v).toBeCloseTo(want.p[k], 6));
        expect(at.s).toBeCloseTo(want.s, 6);
      }
    }
  });

  it("stays finite between stages and clamps outside the range", () => {
    for (let p = -1; p <= STAGES; p += 0.13) {
      for (let i = 0; i < TILE_COUNT; i += 7) {
        const t = tileAt(i, p);
        [...t.p, ...t.r, t.s].forEach((v) => expect(Number.isFinite(v)).toBe(true));
      }
    }
    expect(tileAt(5, -3)).toEqual(tileAt(5, 0));
    expect(tileAt(5, 99)).toEqual(tileAt(5, STAGES - 1));
  });

  it("lines the retrieved chunks up as numbered sources in the answer stage", () => {
    const xs = RETRIEVED.map((i) => stageTransform(i, 4).p[0]);
    expect([...xs].sort((a, b) => a - b)).toEqual(xs);
    RETRIEVED.forEach((i) => expect(tileHighlight(i, 4)).toBe(1));
    expect(tileHighlight(0, 4)).toBe(0);
  });

  it("shows the question from the retrieve stage and the answer in the last", () => {
    expect(questionVisibility(2)).toBe(0);
    expect(questionVisibility(3)).toBe(1);
    expect(answerVisibility(3)).toBe(0);
    expect(answerVisibility(4)).toBe(1);
  });

  it("describes retrieved tiles with real doc text", () => {
    expect(tileInfo(RETRIEVED[0], 4).detail).toContain("full refund within 30 days");
    expect(tileInfo(0, 0).detail).toBe("A help doc, before it is split.");
  });
});
