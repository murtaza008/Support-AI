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
