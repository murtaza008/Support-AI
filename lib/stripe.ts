import Stripe from "stripe";
import type { WorkspacePlan } from "@/lib/generated/prisma/enums";

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

let _stripe: Stripe | null = null;

/** Throws if Stripe isn't configured — callers should check `isStripeConfigured()` first. */
export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe is not configured (STRIPE_SECRET_KEY is unset).");
  }
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}

export const PLAN_PRICE_ENV: Record<Exclude<WorkspacePlan, "STARTER">, string | undefined> = {
  PRO: process.env.STRIPE_PRICE_PRO,
  AGENCY: process.env.STRIPE_PRICE_AGENCY,
};

export const PLAN_DETAILS: Record<
  WorkspacePlan,
  { name: string; price: number; tagline: string; features: string[] }
> = {
  STARTER: {
    name: "Starter",
    price: 0,
    tagline: "Kick the tires. Free forever.",
    features: ["1 assistant", "10 documents", "500 messages / month", "Community support"],
  },
  PRO: {
    name: "Pro",
    price: 79,
    tagline: "Most teams pick this one.",
    features: [
      "5 assistants",
      "50 documents",
      "10,000 messages / month",
      "Remove SupportAI branding",
      "Priority support",
    ],
  },
  AGENCY: {
    name: "Agency",
    price: 199,
    tagline: "Multi-client, white-label, unlimited.",
    features: [
      "Unlimited assistants",
      "200 documents per assistant",
      "50,000 messages / month",
      "Custom domains",
      "Dedicated CSM",
    ],
  },
};
