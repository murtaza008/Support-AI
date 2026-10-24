import type { Role } from "@/lib/generated/prisma/enums";
import { DEMO_EMAIL } from "./constants";
import { NIMBUS } from "./content-nimbus";
import { BLOOM } from "./content-bloom";

export type DemoDocSeed = { key: string; name: string; content: string };

/** One customer question and the assistant's answer. `cites` are doc keys; `[1]` in the answer is `cites[0]`. */
export type DemoTurn = { q: string; a: string; cites: string[] };

export type DemoConversationSeed = {
  channel: "WIDGET" | "PLAYGROUND";
  daysAgo: number;
  /** Extra hours back from `daysAgo`; at least 2 so seeded messages never count toward the hourly chat limit. */
  hoursAgo: number;
  resolved: boolean;
  rating?: number;
  turns: DemoTurn[];
};

export type DemoAssistantSeed = {
  id: string;
  name: string;
  description: string;
  tone: "friendly" | "professional" | "playful";
  brandColor: string;
  systemPrompt: string;
  createdDaysAgo: number;
  /** Copy for the mock website on the widget preview page. */
  preview: { brand: string; headline: string; blurb: string; suggestions: string[] };
  docs: DemoDocSeed[];
  conversations: DemoConversationSeed[];
};

export const DEMO_ASSISTANTS: DemoAssistantSeed[] = [NIMBUS, BLOOM];

export const DEMO_WORKSPACE = {
  name: "SupportAI Demo",
  brandColor: "#FF5A36",
};

/** Fake people only. Teammates get an unusable random password; nobody signs in as them. */
export const DEMO_TEAM: { email: string; displayName: string; role: Role; joinedDaysAgo: number }[] = [
  { email: DEMO_EMAIL, displayName: "Alex Morgan", role: "OWNER", joinedDaysAgo: 48 },
  { email: "priya.raman@supportai.demo", displayName: "Priya Raman", role: "ADMIN", joinedDaysAgo: 39 },
  { email: "marcus.lee@supportai.demo", displayName: "Marcus Lee", role: "MEMBER", joinedDaysAgo: 17 },
];

export function demoAssistantSeed(id: string): DemoAssistantSeed | undefined {
  return DEMO_ASSISTANTS.find((a) => a.id === id);
}
