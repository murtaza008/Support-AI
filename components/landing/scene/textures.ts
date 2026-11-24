import { CanvasTexture, SRGBColorSpace } from "three";

/** Theme colours read from the CSS tokens, so the scene matches the page. */
export type Palette = {
  bg: string;
  surface: string;
  sunken: string;
  fg: string;
  muted: string;
  subtle: string;
  border: string;
  accent: string;
  accentSoft: string;
  accentText: string;
  dark: boolean;
};

export function readPalette(): Palette {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(name).trim();
  return {
    bg: v("--bg"),
    surface: v("--surface"),
    sunken: v("--sunken"),
    fg: v("--fg"),
    muted: v("--fg-muted"),
    subtle: v("--fg-subtle"),
    border: v("--border-strong"),
    accent: v("--accent"),
    accentSoft: v("--accent-soft"),
    accentText: v("--accent-text"),
    dark: document.documentElement.classList.contains("dark"),
  };
}

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  return { c, ctx };
}

function texture(c: HTMLCanvasElement) {
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/**
 * One shared texture for every tile: a few lines of "text". Tiled side by
 * side they read as a page; on their own they read as a passage.
 */
export function tileTexture() {
  const { c, ctx } = canvas(256, 166);
  ctx.fillStyle = "#ffffff"; // tinted per instance via instance colour
  ctx.fillRect(0, 0, 256, 166);
  ctx.fillStyle = "#9aa09c";
  const widths = [0.86, 0.72, 0.9, 0.64, 0.8];
  widths.forEach((w, i) => {
    roundRect(ctx, 22, 24 + i * 26, (256 - 44) * w, 9, 4.5);
    ctx.fill();
  });
  ctx.strokeStyle = "rgba(0,0,0,0.12)";
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, 253, 163);
  return texture(c);
}

function wrapText(ctx: CanvasRenderingContext2D, lines: string[], x: number, y: number, lh: number) {
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lh));
}

export function questionTexture(p: Palette, question: string) {
  const { c, ctx } = canvas(1024, 256);
  ctx.fillStyle = p.surface;
  roundRect(ctx, 4, 4, 1016, 248, 36);
  ctx.fill();
  ctx.strokeStyle = p.border;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = p.subtle;
  ctx.font = "600 34px ui-monospace, 'JetBrains Mono', monospace";
  ctx.fillText("CUSTOMER QUESTION", 56, 86);
  ctx.fillStyle = p.fg;
  ctx.font = "600 50px Inter, system-ui, sans-serif";
  ctx.fillText(question, 56, 170, 912);
  return texture(c);
}

export function answerTexture(p: Palette, lines: string[]) {
  const { c, ctx } = canvas(1024, 440);
  ctx.fillStyle = p.surface;
  roundRect(ctx, 4, 4, 1016, 432, 36);
  ctx.fill();
  ctx.strokeStyle = p.accent;
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fillStyle = p.accentText;
  ctx.font = "600 32px ui-monospace, 'JetBrains Mono', monospace";
  ctx.fillText("ANSWER · 2 SOURCES CITED", 56, 84);
  ctx.fillStyle = p.fg;
  ctx.font = "500 46px Inter, system-ui, sans-serif";
  wrapText(ctx, lines, 56, 160, 66);
  return texture(c);
}
