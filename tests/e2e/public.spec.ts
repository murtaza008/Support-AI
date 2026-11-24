import { test, expect } from "@playwright/test";
import { expectAccessible, themes, useTheme } from "./helpers";

const publicPages = [
  { path: "/", name: "landing" },
  { path: "/login", name: "login" },
  { path: "/signup", name: "signup" },
];

for (const theme of themes) {
  test.describe(`public pages (${theme})`, () => {
    test.beforeEach(async ({ page }) => useTheme(page, theme));

    for (const p of publicPages) {
      test(`${p.name} renders and passes axe`, async ({ page }) => {
        await page.goto(p.path);
        await expect(page.locator("h1").first()).toBeVisible();
        await expectAccessible(page, `${p.name} (${theme})`);
      });
    }

    test("unknown URL shows the 404 page and passes axe", async ({ page }) => {
      const res = await page.goto("/this-page-does-not-exist");
      expect(res?.status()).toBe(404);
      await expect(page.locator("h1, h2").first()).toBeVisible();
      await expectAccessible(page, `404 (${theme})`);
    });
  });
}

test("signed-out visitors are sent to login from app pages", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});
