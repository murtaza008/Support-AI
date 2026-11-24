/** Citation helpers for streamed answers (playground). Pure, unit tested. */

export type Citation = { documentId: string; documentName: string; similarity: number };

/** Reads the X-Citations header the chat route sends (URI-encoded JSON). */
export function parseCitationsHeader(value: string | null): Citation[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(value));
    return Array.isArray(parsed) ? (parsed as Citation[]) : [];
  } catch {
    return [];
  }
}

/**
 * Splits "[1]", "[2, 3]" markers out of the answer text. Punctuation right
 * after a marker is attached to it, so "[2]." never wraps the full stop alone.
 */
export function segments(text: string) {
  const out: (string | { nums: number[]; tail: string })[] = [];
  const re = /\[(\d+(?:\s*,\s*\d+)*)\]/g;
  let last = 0;
  for (const match of text.matchAll(re)) {
    if (match.index > last) out.push(text.slice(last, match.index));
    const after = text.slice(match.index + match[0].length).match(/^[.,;:!?)]+/)?.[0] ?? "";
    out.push({ nums: match[1].split(",").map((n) => Number(n.trim())), tail: after });
    last = match.index + match[0].length + after.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
