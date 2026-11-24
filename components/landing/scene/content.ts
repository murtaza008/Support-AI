import { PER_PAGE, RETRIEVED } from "./layouts";

/**
 * Text used by the scene's tooltips and cards. Taken from the seeded demo
 * workspace's help docs (lib/demo/content-nimbus.ts), so what the scene shows
 * is the same content the live demo answers from.
 */
export const DOC_NAMES = [
  "Refunds and Cancellations",
  "Billing and Plans",
  "Account and Security",
  "Getting Started with Nimbus",
] as const;

export const QUESTION = "Can I get a refund on my annual plan?";

export const ANSWER_LINES = [
  "Yes. Annual plans get a full refund within",
  "30 days of purchase or renewal [1].",
  "Cancel first under Settings > Billing, then",
  "email billing from the owner's address [2].",
];

/** What each retrieved chunk says, in rank order. */
export const RETRIEVED_SNIPPETS = [
  "Annual plans: you can get a full refund within 30 days of purchase or renewal.",
  "Cancel the plan first, then email billing@nimbus-pm.example from the workspace owner's address.",
  "Approved refunds go back to the original payment method within 5 to 10 business days.",
  "Monthly plans: payments are non-refundable, except for your first paid charge.",
  "Workspace owners can cancel at any time from Settings > Billing > Cancel plan.",
  "Seat credits from removed members are applied to your next invoice.",
];

export type TileInfo = { title: string; detail: string };

export function tileInfo(i: number, stage: number): TileInfo {
  const rank = (RETRIEVED as readonly number[]).indexOf(i);
  if (rank >= 0 && stage >= 3) {
    return {
      title: `Source ${rank + 1} · ${DOC_NAMES[0]}`,
      detail: `“${RETRIEVED_SNIPPETS[rank]}”`,
    };
  }
  const doc = DOC_NAMES[Math.floor(i / PER_PAGE) % DOC_NAMES.length];
  if (stage === 0) return { title: doc, detail: "A help doc, before it is split." };
  if (stage === 1) return { title: `${doc} · chunk`, detail: "About 1,000 characters, cut at a paragraph break." };
  return { title: `${doc} · chunk`, detail: "Stored with a 768-number embedding in Postgres (pgvector)." };
}
