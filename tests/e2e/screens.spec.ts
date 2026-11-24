import { test, expect, type Page } from "@playwright/test";
import path from "node:path";
import { themes, type Theme } from "./helpers";

/**
 * Review screenshots (not assertions): light + dark, open hover cards, menus
 * and a mid-animation frame. Only runs when SCREENS_DIR is set:
 *
 *   SCREENS_DIR=./shots SCREENS=shell,dashboard npx playwright test --project=screens
 */
const dir = process.env.SCREENS_DIR;
const only = (process.env.SCREENS ?? "").split(",").filter(Boolean);
test.skip(!dir, "set SCREENS_DIR to capture review screenshots");

const want = (name: string) => only.length === 0 || only.includes(name);
const shot = (page: Page, name: string, theme: Theme, fullPage = false) =>
  page.screenshot({ path: path.join(dir!, `${name}-${theme}.png`), fullPage });

for (const theme of themes) {
  test.describe(theme, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.emulateMedia({ colorScheme: theme });
      await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
    });

    test("shell", async ({ page }) => {
      test.skip(!want("shell"));
      await page.goto("/dashboard");
      await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
      await page.waitForTimeout(900);
      await shot(page, "shell-dashboard", theme);

      await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Knowledge" }).hover();
      await page.waitForTimeout(700);
      await shot(page, "shell-nav-hovercard", theme);

      await page.mouse.move(900, 600);
      await page.keyboard.press("Control+k");
      await page.keyboard.type("n");
      await page.waitForTimeout(400);
      await shot(page, "shell-command-palette", theme);
      await page.keyboard.press("Escape");

      await page.getByRole("button", { name: /^notifications/i }).click();
      await page.waitForTimeout(400);
      await shot(page, "shell-notifications", theme);
      await page.keyboard.press("Escape");

      await page.getByRole("button", { name: "Account menu" }).click();
      await page.waitForTimeout(300);
      await shot(page, "shell-user-menu", theme);
      await page.keyboard.press("Escape");

      // Mid-animation: navigate and capture ~120ms into the page transition.
      await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Team" }).click();
      await page.waitForTimeout(120);
      await shot(page, "shell-mid-transition", theme);

      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/dashboard");
      await page.waitForTimeout(600);
      await shot(page, "shell-mobile", theme);
      await page.getByRole("button", { name: "Open navigation" }).click();
      await page.waitForTimeout(400);
      await shot(page, "shell-mobile-nav", theme);
    });

    // Screenshots used by the landing page and README (public/screens).
    // Two passes: SCREENS=marketing (app screens), rebuild, then SCREENS=marketing-landing.
    test("marketing", async ({ page }) => {
      test.skip(!want("marketing"));
      test.setTimeout(240_000);
      const out = process.env.MARKETING_DIR ?? "public/screens";
      await page.setViewportSize({ width: 1360, height: 850 });
      const ready = async () => {
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(1800);
        await page.mouse.move(1355, 845);
      };
      await page.goto("/dashboard");
      await page.getByRole("region", { name: "Last 30 days" }).locator("[data-value]").first().waitFor({ timeout: 60_000 });
      await ready();
      await page.screenshot({ path: path.join(out, `dashboard-${theme}.png`) });
      await page.goto("/analytics");
      await page.getByRole("region", { name: "Last 30 days" }).locator("[data-value]").first().waitFor({ timeout: 60_000 });
      await ready();
      await page.screenshot({ path: path.join(out, `analytics-${theme}.png`) });
      const { mockChat } = await import("./helpers");
      await mockChat(
        page,
        "Annual plans can be refunded in full within 30 days of purchase or renewal [1]. Cancel the plan first under Settings > Billing, then email billing from the workspace owner's address [2].",
        // Real demo document names (the answer is mocked so no Gemini call is made).
        [
          { documentId: "readme-1", documentName: "Refunds and Cancellations", similarity: 0.82 },
          { documentId: "readme-2", documentName: "Refunds and Cancellations", similarity: 0.74 },
          { documentId: "readme-3", documentName: "Billing and Plans", similarity: 0.66 },
        ],
      );
      await page.goto("/assistants/de300000-0000-4000-8000-0000000000a1/playground");
      await page.getByRole("heading", { level: 1 }).waitFor({ timeout: 60_000 });
      await ready();
      const box = page.getByRole("textbox", { name: /^message/i });
      await box.fill("Can I get a refund on my annual plan?");
      await box.press("Enter");
      await page.getByText(/refunded in full/).waitFor();
      await page.waitForTimeout(600);
      await page.mouse.move(1355, 845);
      await page.screenshot({ path: path.join(out, `playground-${theme}.png`) });
    });

    test("marketing landing", async ({ browser }) => {
      test.skip(!want("marketing-landing"));
      const out = process.env.MARKETING_DIR ?? "public/screens";
      // Signed out: a first-time visitor.
      const ctx = await browser.newContext({
        viewport: { width: 1360, height: 850 },
        colorScheme: theme,
        storageState: { cookies: [], origins: [] },
      });
      const page = await ctx.newPage();
      await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
      await page.goto("/");
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(out, `landing-${theme}.png`) });
      await page.locator("#how-it-works ol > li").nth(4).scrollIntoViewIfNeeded();
      await page.locator("[data-scene=css3d]").waitFor({ timeout: 20_000 });
      await page.waitForTimeout(2500);
      await page.screenshot({ path: path.join(out, `landing-3d-${theme}.png`) });
      await ctx.close();
    });

    test("theme reveal", async ({ page }) => {
      test.skip(!want("theme") || theme === "dark");
      await page.goto("/dashboard");
      await page.waitForTimeout(800);
            await page.getByRole("radio", { name: "Dark" }).click();
      await page.waitForTimeout(160);
      await shot(page, "theme-reveal-mid", theme);
    });
  });
}

test.describe("landing review", () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  for (const theme of themes) {
    test(`landing ${theme}`, async ({ page }) => {
      test.skip(!want("landing"));
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.emulateMedia({ colorScheme: theme });
      await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
      await page.goto("/");
      await page.waitForTimeout(250);
      await shot(page, "landing-hero-mid", theme);
      await page.waitForTimeout(1200);
      await shot(page, "landing-hero", theme);
      await expect(page.locator("[data-scene-tile]")).toHaveCount(96, { timeout: 15_000 });
      const steps = page.locator("#how-it-works ol > li");
      for (let i = 0; i < 5; i++) {
        await steps.nth(i).scrollIntoViewIfNeeded();
        await page.mouse.wheel(0, 200);
        await page.waitForTimeout(1600);
        await shot(page, `landing-stage-${i}`, theme);
      }
      // Hover a tile in the answer stage.
      const box = await page.locator("[data-scene=css3d]").boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.78);
        await page.waitForTimeout(500);
        await shot(page, "landing-stage-hover", theme);
      }
      await page.locator("#features").scrollIntoViewIfNeeded();
      await page.waitForTimeout(900);
      await page.locator("#features").getByRole("button", { name: "1", exact: true }).hover();
      await page.waitForTimeout(300);
      await shot(page, "landing-features", theme);
      await page.locator("#pricing").scrollIntoViewIfNeeded();
      await page.waitForTimeout(900);
      await shot(page, "landing-pricing", theme);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/");
      await page.waitForTimeout(1500);
      await shot(page, "landing-mobile", theme);
      await page.locator("#how-it-works ol > li").nth(2).scrollIntoViewIfNeeded();
      await page.waitForTimeout(2500);
      await shot(page, "landing-mobile-story", theme);
    });
  }
});

test.describe("data review", () => {
  for (const theme of themes) {
    test(`data ${theme}`, async ({ page }) => {
      test.skip(!want("data"));
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.emulateMedia({ colorScheme: theme });
      await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
      await page.goto("/dashboard");
      const kpi = page.getByRole("region", { name: "Last 30 days" }).locator("[data-value]").first();
      await kpi.waitFor({ timeout: 60_000 });
      await page.waitForTimeout(250);
      await shot(page, "dashboard-mid", theme);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1500);
      await shot(page, "dashboard", theme, true);
      await page.getByRole("region", { name: "Last 30 days" }).getByText("Resolution rate", { exact: true }).hover();
      await page.waitForTimeout(600);
      await shot(page, "dashboard-kpi-hover", theme);
      const chart = page.locator(".recharts-surface").first();
      const box = await chart.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.5);
        await page.waitForTimeout(400);
        await shot(page, "dashboard-chart-tooltip", theme);
      }
      await page.goto("/analytics");
      await page.getByRole("region", { name: "Last 30 days" }).locator("[data-value]").first().waitFor({ timeout: 60_000 });
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1500);
      await shot(page, "analytics", theme, true);
      await page.locator("[aria-label='Messages by weekday and hour']").first().scrollIntoViewIfNeeded().catch(() => {});
      await page.getByText("When customers ask").scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await shot(page, "analytics-heatmap", theme);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/dashboard");
      await page.getByRole("region", { name: "Last 30 days" }).locator("[data-value]").first().waitFor({ timeout: 60_000 });
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1500);
      await shot(page, "dashboard-mobile", theme, true);
    });
  }
});

test.describe("playground review", () => {
  for (const theme of themes) {
    test(`playground ${theme}`, async ({ page }) => {
      test.skip(!want("playground"));
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.emulateMedia({ colorScheme: theme });
      await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
      const { mockChat } = await import("./helpers");
      await mockChat(
        page,
        "Annual plans can be refunded in full within 30 days of purchase or renewal [1]. Cancel the plan first under Settings > Billing, then email billing from the workspace owner's address [2].",
      );
      await page.goto("/assistants/de300000-0000-4000-8000-0000000000a1/playground");
      await page.getByRole("heading", { level: 1 }).waitFor({ timeout: 60_000 });
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(800);
      await shot(page, "playground-empty", theme);
      const box = page.getByRole("textbox", { name: /^message/i });
      await box.fill("Can I get a refund on my annual plan?");
      await box.press("Enter");
      await page.getByText(/refunded in full/).waitFor();
      await page.waitForTimeout(400);
      await page.getByRole("button", { name: /^Source 1/ }).hover();
      await page.waitForTimeout(500);
      await shot(page, "playground-answer", theme);
      await page.getByRole("button", { name: /^Source 1/ }).click();
      await page.waitForTimeout(1500);
      await shot(page, "playground-reader", theme);
      await page.keyboard.press("Escape");
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(500);
      await shot(page, "playground-mobile", theme);
    });
  }
});

test.describe("pages review", () => {
  for (const theme of themes) {
    test(`pages ${theme}`, async ({ page }) => {
      test.skip(!want("pages"));
      test.setTimeout(240_000);
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.emulateMedia({ colorScheme: theme });
      await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
      const settle = async () => {
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(900);
      };
      for (const p of ["assistants", "knowledge", "conversations", "team", "settings", "billing"]) {
        await page.goto(`/${p}`);
        await page.locator("main h1").waitFor({ timeout: 60_000 });
        await settle();
        await shot(page, `page-${p}`, theme);
      }
      await page.goto("/knowledge");
      await settle();
      await page.locator("tbody tr button").first().hover();
      await page.waitForTimeout(900);
      await shot(page, "page-knowledge-hover", theme);
      await page.getByRole("button", { name: "Add document" }).click();
      await page.waitForTimeout(400);
      await shot(page, "dialog-add-document", theme);
      await page.keyboard.press("Escape");
      await page.goto("/assistants");
      await settle();
      await page.getByRole("button", { name: /^More actions/ }).first().click();
      await page.getByRole("menuitem", { name: "Edit settings" }).click();
      await page.waitForTimeout(1200);
      await shot(page, "sheet-edit-assistant", theme);
      await page.keyboard.press("Escape");
      const convs = await (await page.request.get("/api/workspaces/current")).json();
      const list = await (await page.request.get(`/api/conversations?workspaceId=${convs.id}`)).json();
      await page.goto(`/conversations?c=${list[0].id}`);
      await settle();
      await shot(page, "page-conversations-open", theme);
      await page.goto("/invite/not-a-real-token");
      await settle();
      await shot(page, "page-invite-invalid", theme);
      await page.goto("/this-does-not-exist");
      await settle();
      await shot(page, "page-404", theme);
      await page.context().clearCookies();
      await page.goto("/login");
      await settle();
      await shot(page, "page-login", theme);
      await page.goto("/signup");
      await settle();
      await shot(page, "page-signup", theme);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/login");
      await settle();
      await shot(page, "page-login-mobile", theme);
    });
  }
});
