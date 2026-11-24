/**
 * Stage layouts for the landing scene. One continuous set of tiles (each tile
 * stands for one chunk of a help doc) moves through five stages as you scroll:
 *
 *   0 Upload   – tiles form four stacked pages
 *   1 Split    – pages separate and open into chunks
 *   2 Index    – chunks settle on a sphere (the vector index)
 *   3 Retrieve – a question arrives; the 6 nearest chunks move towards it
 *   4 Answer   – those 6 line up as the answer's numbered sources
 *
 * Pure functions, no three.js imports, so they are cheap to unit test.
 */

export const PAGES = 4;
export const COLS = 4;
export const ROWS = 6;
export const PER_PAGE = COLS * ROWS;
export const TILE_COUNT = PAGES * PER_PAGE;
export const TILE_W = 0.34;
export const TILE_H = 0.22;
export const STAGES = 5;
/** Retrieved chunks, in rank order. Picked from the front of the sphere. */
export const RETRIEVED = [41, 18, 66, 7, 53, 88] as const;

export type Vec3 = [number, number, number];
export type TileTransform = { p: Vec3; r: Vec3; s: number };

const rot2 = (x: number, y: number, a: number): [number, number] => [
  x * Math.cos(a) - y * Math.sin(a),
  x * Math.sin(a) + y * Math.cos(a),
];

function pageLocal(i: number, gap = 1): [number, number] {
  const local = i % PER_PAGE;
  const col = local % COLS;
  const row = Math.floor(local / COLS);
  return [(col - (COLS - 1) / 2) * TILE_W * gap, ((ROWS - 1) / 2 - row) * TILE_H * gap];
}

function fibonacciSphere(i: number, n: number, radius: number): Vec3 {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const y = 1 - (i / (n - 1)) * 2;
  const r = Math.sqrt(1 - y * y);
  const theta = golden * i;
  return [Math.cos(theta) * r * radius, y * radius * 0.82, Math.sin(theta) * r * radius];
}

/** Rotation that makes a tile on the sphere face outward. */
function faceOutward([x, y, z]: Vec3): Vec3 {
  return [-Math.atan2(y, Math.hypot(x, z)) * 0.9, Math.atan2(x, z), 0];
}

export function stageTransform(i: number, stage: number): TileTransform {
  const page = Math.floor(i / PER_PAGE);
  const rank = (RETRIEVED as readonly number[]).indexOf(i);

  switch (stage) {
    case 0: {
      const a = (page - 1.5) * 0.07;
      const [lx, ly] = rot2(...pageLocal(i), a);
      return { p: [lx - 0.2 + page * 0.16, ly + 0.12 - page * 0.07, -page * 0.14], r: [0, 0, a], s: 1 };
    }
    case 1: {
      const [lx, ly] = pageLocal(i, 1.2);
      const wobble = ((i * 37) % 11) / 11 - 0.5;
      const px = (page % 2) - 0.5;
      const py = 0.5 - Math.floor(page / 2);
      return { p: [lx * 0.92 + px * 1.95, ly * 0.92 + py * 1.72, wobble * 0.18], r: [0, px * -0.18, 0], s: 0.88 };
    }
    case 2: {
      const p = fibonacciSphere(i, TILE_COUNT, 1.95);
      return { p, r: faceOutward(p), s: 0.78 };
    }
    case 3: {
      if (rank >= 0) {
        const a = (rank / RETRIEVED.length) * Math.PI * 2 + Math.PI / 2;
        return { p: [Math.cos(a) * 1.55, Math.sin(a) * 0.95, 0.85], r: [0, 0, 0], s: 0.92 };
      }
      const p = fibonacciSphere(i, TILE_COUNT, 2.25);
      return { p: [p[0], p[1], p[2] - 1.7], r: faceOutward(p), s: 0.6 };
    }
    default: {
      if (rank >= 0) {
        return { p: [(rank - 2.5) * 0.44, -1.02, 0.95], r: [0, 0, 0], s: 0.96 };
      }
      const p = fibonacciSphere(i, TILE_COUNT, 3.1);
      return { p: [p[0], p[1] + 0.2, p[2] - 2.4], r: faceOutward(p), s: 0.4 };
    }
  }
}

const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Transform of tile `i` at continuous progress `p` in [0, STAGES - 1].
 * Each tile starts its move slightly after its neighbour, so stages flow
 * instead of switching all at once.
 */
export function tileAt(i: number, p: number): TileTransform {
  const clamped = Math.min(Math.max(p, 0), STAGES - 1);
  const from = Math.min(Math.floor(clamped), STAGES - 2);
  const raw = clamped - from;
  const delay = ((i * 53) % TILE_COUNT) / TILE_COUNT * 0.35;
  const t = smooth(Math.min(Math.max((raw - delay) / (1 - 0.35), 0), 1));
  const a = stageTransform(i, from);
  const b = stageTransform(i, from + 1);
  return {
    p: [lerp(a.p[0], b.p[0], t), lerp(a.p[1], b.p[1], t), lerp(a.p[2], b.p[2], t)],
    r: [lerp(a.r[0], b.r[0], t), lerp(a.r[1], b.r[1], t), lerp(a.r[2], b.r[2], t)],
    s: lerp(a.s, b.s, t),
  };
}

/** 0..1 visibility of the question card (stage 3 onward). */
export function questionVisibility(p: number) {
  return smooth(Math.min(Math.max(p - 2.35, 0) / 0.65, 1));
}

/** 0..1 visibility of the answer card (stage 4). */
export function answerVisibility(p: number) {
  return smooth(Math.min(Math.max(p - 3.3, 0) / 0.7, 1));
}

/** How "lit" (accent) a tile is: retrieved chunks light up from stage 3. */
export function tileHighlight(i: number, p: number) {
  if (!(RETRIEVED as readonly number[]).includes(i)) return 0;
  return smooth(Math.min(Math.max(p - 2.4, 0) / 0.6, 1));
}

/** How faded a non-retrieved tile is in the answer stage. */
export function tileDim(i: number, p: number) {
  if ((RETRIEVED as readonly number[]).includes(i)) return 0;
  return smooth(Math.min(Math.max(p - 2.6, 0) / 1.2, 1)) * 0.75;
}
