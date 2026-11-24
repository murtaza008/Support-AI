/**
 * Pure helpers behind GET /api/analytics. Everything here is derived from rows
 * the app already stores: conversations, messages and the citations saved on
 * each answer.
 */

export const ANALYTICS_RANGES = [7, 30, 90] as const;
export type AnalyticsRange = (typeof ANALYTICS_RANGES)[number];

export type Citation = { documentId: string; documentName: string; similarity?: number };

export type TopDocument = { id: string; name: string; citations: number; answers: number };

export type Gap = {
  conversationId: string;
  assistantId: string | null;
  question: string;
  at: string;
};

export function parseCitations(value: unknown): Citation[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (c): c is Citation =>
      !!c && typeof c === "object" && typeof (c as Citation).documentId === "string" && typeof (c as Citation).documentName === "string",
  );
}

/** Documents cited most often by answers, with how many answers used each. */
export function topDocuments(answers: { citations: unknown }[], limit = 5): TopDocument[] {
  const byId = new Map<string, TopDocument>();
  for (const a of answers) {
    const cites = parseCitations(a.citations);
    const seen = new Set<string>();
    for (const c of cites) {
      const row = byId.get(c.documentId) ?? { id: c.documentId, name: c.documentName, citations: 0, answers: 0 };
      row.citations += 1;
      if (!seen.has(c.documentId)) {
        row.answers += 1;
        seen.add(c.documentId);
      }
      byId.set(c.documentId, row);
    }
  }
  return [...byId.values()]
    .sort((a, b) => b.answers - a.answers || b.citations - a.citations || a.name.localeCompare(b.name))
    .slice(0, limit);
}

type AnswerRow = { conversationId: string; createdAt: Date; citations: unknown };
type QuestionRow = { conversationId: string; createdAt: Date; content: string };

/** Answers that cited nothing: the customer's question was not covered by the docs. */
export function uncitedAnswers<T extends AnswerRow>(answers: T[]): T[] {
  return answers.filter((a) => parseCitations(a.citations).length === 0);
}

/**
 * Pair each uncited answer with the customer question right before it in the
 * same conversation. Newest first, one per conversation.
 */
export function findGaps(
  uncited: AnswerRow[],
  questions: QuestionRow[],
  assistantOf: Map<string, string>,
  limit = 8,
): Gap[] {
  const byConv = new Map<string, QuestionRow[]>();
  for (const q of questions) {
    const list = byConv.get(q.conversationId) ?? [];
    list.push(q);
    byConv.set(q.conversationId, list);
  }
  const gaps: Gap[] = [];
  const used = new Set<string>();
  for (const a of [...uncited].sort((x, y) => y.createdAt.getTime() - x.createdAt.getTime())) {
    if (used.has(a.conversationId)) continue;
    const q = (byConv.get(a.conversationId) ?? [])
      .filter((m) => m.createdAt.getTime() <= a.createdAt.getTime())
      .sort((x, y) => y.createdAt.getTime() - x.createdAt.getTime())[0];
    if (!q) continue;
    used.add(a.conversationId);
    const text = q.content.trim().replace(/\s+/g, " ");
    gaps.push({
      conversationId: a.conversationId,
      assistantId: assistantOf.get(a.conversationId) ?? null,
      question: text.length > 160 ? `${text.slice(0, 159).trimEnd()}…` : text,
      at: a.createdAt.toISOString(),
    });
    if (gaps.length >= limit) break;
  }
  return gaps;
}

/** Percentage change; null when there is nothing to compare against. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}
