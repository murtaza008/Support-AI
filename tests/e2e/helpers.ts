import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

export type Theme = "light" | "dark";
export const themes: Theme[] = ["light", "dark"];

/** Put the page in a theme before it loads (next-themes reads localStorage). */
export async function useTheme(page: Page, theme: Theme) {
  await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
  await page.addInitScript((t) => {
    try {
      localStorage.setItem("theme", t);
    } catch {}
  }, theme);
}

/** WCAG 2.1 AA scan of the current page state. Fails with a readable summary. */
export async function expectAccessible(page: Page, label: string) {
  // Let entry animations settle so colours are measured at their final values.
  await page.waitForTimeout(150);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const summary = results.violations.map(
    (v) =>
      `${v.id} (${v.impact}): ${v.help}\n` +
      v.nodes
        .slice(0, 5)
        .map((n) => `    ${n.target.join(" ")}\n      ${n.failureSummary?.split("\n").join("\n      ")}`)
        .join("\n"),
  );
  expect(summary, `axe violations on ${label}`).toEqual([]);
}

/**
 * Mock the playground chat stream (AI SDK UI message stream, v1) so tests never
 * call Gemini. Returns a citation header like the real route does.
 */
export async function mockChat(page: Page, answer: string) {
  await page.route("**/api/chat", async (route) => {
    const words = answer.split(/(?<= )/);
    const events = [
      { type: "start" },
      { type: "start-step" },
      { type: "text-start", id: "t1" },
      ...words.map((delta) => ({ type: "text-delta", id: "t1", delta })),
      { type: "text-end", id: "t1" },
      { type: "finish-step" },
      { type: "finish" },
    ];
    const body = events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join("") + "data: [DONE]\n\n";
    await route.fulfill({
      status: 200,
      headers: {
        "content-type": "text/event-stream",
        "x-vercel-ai-ui-message-stream": "v1",
        "x-conversation-id": "",
        "x-citations": encodeURIComponent(
          JSON.stringify([{ documentId: "doc-mock", documentName: "Refund policy", similarity: 0.82 }]),
        ),
      },
      body,
    });
  });
}

export const appPages = [
  { path: "/dashboard", label: "Overview" },
  { path: "/assistants", label: "Assistants" },
  { path: "/knowledge", label: "Knowledge" },
  { path: "/conversations", label: "Conversations" },
  { path: "/analytics", label: "Analytics" },
  { path: "/team", label: "Team" },
  { path: "/billing", label: "Billing" },
  { path: "/settings", label: "Settings" },
] as const;

export const DEMO_NIMBUS_ASSISTANT_ID = "de300000-0000-4000-8000-0000000000a1";

/** The page is loaded: the breadcrumb names it and the page has its h1. */
export async function expectPage(page: Page, label: string) {
  await expect(page.getByRole("navigation", { name: "Breadcrumb" }).getByText(label, { exact: true })).toBeVisible();
  await expect(page.locator("main h1").first()).toBeVisible();
}
