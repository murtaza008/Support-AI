/**
 * Public demo account. Edge-safe (no Prisma/Node imports) so the auth config,
 * route handlers and client components can all share it.
 */
export const DEMO_EMAIL = "demo@supportai.demo";
/** Every demo user lives on this reserved domain; sign-up refuses it. */
export const DEMO_EMAIL_DOMAIN = "@supportai.demo";
/** Normal workspaces always get a random suffix, so this slug can only be the demo's. */
export const DEMO_WORKSPACE_SLUG = "supportai-demo";
export const DEMO_WORKSPACE_ID = "de300000-0000-4000-8000-000000000001";

export const DEMO_NIMBUS_ASSISTANT_ID = "de300000-0000-4000-8000-0000000000a1";
export const DEMO_BLOOM_ASSISTANT_ID = "de300000-0000-4000-8000-0000000000a2";

/** Live chat budget per visitor (IP) across playground + widget. */
export const DEMO_CHAT_LIMIT_PER_HOUR = 15;
/** Ceiling for all demo visitors together, so rotating IPs can't drain the Gemini quota. */
export const DEMO_CHAT_GLOBAL_LIMIT_PER_HOUR = 300;
/** Visitors may create a few extra assistants to try the flow; reset removes them. */
export const DEMO_MAX_ASSISTANTS = 6;

export function isDemoEmail(email: string | null | undefined): boolean {
  return email?.toLowerCase().trim() === DEMO_EMAIL;
}
