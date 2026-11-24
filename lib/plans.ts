/**
 * Plan catalogue shared by the landing page and the billing page.
 * Limits are plan copy: the API does not enforce them yet (see README,
 * "Known limitations"). Only list features the product actually has.
 */
export type PlanKey = "STARTER" | "PRO" | "AGENCY";

export type Plan = {
  key: PlanKey;
  name: string;
  price: number;
  summary: string;
  limits: { assistants: string; documents: string; messages: string };
};

export const PLANS: Plan[] = [
  {
    key: "STARTER",
    name: "Starter",
    price: 0,
    summary: "For trying it on one product or help centre.",
    limits: { assistants: "1 assistant", documents: "10 documents", messages: "500 messages a month" },
  },
  {
    key: "PRO",
    name: "Pro",
    price: 79,
    summary: "For a support team with a few products.",
    limits: { assistants: "5 assistants", documents: "50 documents", messages: "10,000 messages a month" },
  },
  {
    key: "AGENCY",
    name: "Agency",
    price: 199,
    summary: "For agencies with several clients.",
    limits: {
      assistants: "Unlimited assistants",
      documents: "200 documents per assistant",
      messages: "50,000 messages a month",
    },
  },
];

/** Included on every plan. */
export const EVERY_PLAN = [
  "Answers with numbered citations",
  "Website widget (one script tag)",
  "Conversation history and analytics",
  "Owner, admin and member roles",
];
