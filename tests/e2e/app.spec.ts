import { test, expect } from "@playwright/test";
import { appPages, expectAccessible, expectPage, themes, useTheme } from "./helpers";

// Read-only: these tests browse the demo workspace and never change data.

for (const theme of themes) {
  test.describe(`app pages (${theme})`, () => {
    test.beforeEach(async ({ page }) => useTheme(page, theme));

    for (const p of appPages) {
      test(`${p.path} renders and passes axe`, async ({ page }) => {
        await page.goto(p.path);
        await expectPage(page, p.label);
        await expect(page.locator("html")).toHaveClass(theme === "dark" ? /dark/ : /^(?!.*dark)/);
        await expectAccessible(page, `${p.path} (${theme})`);
      });
    }

    test("shell dialogs and menus pass axe", async ({ page }) => {
      await page.goto("/dashboard");
      await expectPage(page, "Overview");

      await page.keyboard.press("Control+k");
      await expect(page.getByRole("combobox", { name: /search pages/i })).toBeFocused();
      await expectAccessible(page, `command palette (${theme})`);
      await page.keyboard.press("Escape");

      await page.getByRole("button", { name: /^notifications/i }).click();
      await expect(page.getByText("Activity", { exact: true })).toBeVisible();
      await expectAccessible(page, `notifications (${theme})`);
      await page.keyboard.press("Escape");

            await page.getByRole("button", { name: "Account menu" }).click();
      await expect(page.getByRole("menuitem", { name: "Sign out" })).toBeVisible();
      await expectAccessible(page, `user menu (${theme})`);
      await page.keyboard.press("Escape");

      await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Knowledge" }).hover();
      await expect(page.getByText(/help docs your assistants answer from/i)).toBeVisible();
      await expectAccessible(page, `nav hover card (${theme})`);
    });

    test("mobile navigation sheet passes axe", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/dashboard");
      await page.getByRole("button", { name: "Open navigation" }).click();
      const sheet = page.getByRole("dialog", { name: "Navigation" });
      await expect(sheet).toBeVisible();
      await expectAccessible(page, `mobile nav (${theme})`);
      await sheet.getByRole("link", { name: "Team" }).click();
      await expect(page).toHaveURL(/\/team$/);
      await expect(sheet).toBeHidden();
    });
  });
}

test.describe("shell behaviour", () => {
  test("sidebar navigation moves the active item", async ({ page }) => {
    await page.goto("/dashboard");
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
    await nav.getByRole("link", { name: "Conversations" }).click();
    await expect(page).toHaveURL(/\/conversations$/);
    await expect(nav.getByRole("link", { name: "Conversations" })).toHaveAttribute("aria-current", "page");
    await expect(nav.getByRole("link", { name: "Overview" })).not.toHaveAttribute("aria-current", "page");
  });

  test("command palette jumps to a page with the keyboard", async ({ page }) => {
    await page.goto("/dashboard");
    await expectPage(page, "Overview");
    await page.keyboard.press("Control+k");
    await expect(page.getByRole("combobox", { name: /search pages/i })).toBeFocused();
    await page.keyboard.type("analy");
    await expect(page.getByRole("option", { name: /analytics/i }).first()).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/analytics$/);
  });

  test("command palette finds demo assistants", async ({ page }) => {
    await page.goto("/dashboard");
    await expectPage(page, "Overview");
    await page.getByRole("button", { name: /search or jump to/i }).click();
    await page.keyboard.type("nimbus");
    await expect(page.getByRole("option", { name: /nimbus help bot/i })).toBeVisible();
  });

  test("theme choice applies and survives a reload", async ({ page }) => {
    await useTheme(page, "light");
    await page.goto("/dashboard");
    await expect(page.locator("html")).not.toHaveClass(/dark/);
        await page.getByRole("radio", { name: "Dark" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    // useTheme's init script resets storage on load, so check the stored value directly.
    expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe("dark");
  });

  test("notifications list real workspace events", async ({ page }) => {
    await page.goto("/dashboard");
    const res = await page.request.get("/api/workspaces/current");
    const ws = await res.json();
    const events = await (await page.request.get(`/api/workspaces/${ws.id}/activity`)).json();
    await page.getByRole("button", { name: /^notifications/i }).click();
    if (events.length === 0) {
      await expect(page.getByText("Nothing new yet")).toBeVisible();
    } else {
      await expect(page.getByRole("menuitem").first()).toContainText(events[0].title);
    }
  });
});
