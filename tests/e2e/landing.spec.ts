import { test, expect } from "@playwright/test";

test.describe("landing page", () => {
  test.describe("without JavaScript", () => {
    test.use({ javaScriptEnabled: false });
    test("the headline is server-rendered and paints before any JS", async ({ page }) => {
      await page.goto("/");
      const h1 = page.locator("h1");
      await expect(h1).toBeVisible();
      const text = (await h1.textContent())?.replace(/\s+/g, " ").trim();
      expect(text).toBe("Answers from your help docs, with the source attached.");
    });
  });

  test("renders the 3D story and moves it with scroll", async ({ page }) => {
    await page.goto("/");
    const tiles = page.locator("[data-scene-tile]");
    await expect(tiles).toHaveCount(96, { timeout: 15_000 });
    const tile = tiles.nth(41);
    await page.locator("#how-it-works").scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    const early = await tile.evaluate((el) => el.style.transform);
    const steps = page.locator("#how-it-works ol > li");
    await expect(steps).toHaveCount(5);
    await steps.nth(4).scrollIntoViewIfNeeded();
    await expect(steps.nth(4).getByText("Answer from those passages, with sources")).toBeVisible();
    await expect.poll(() => tile.evaluate((el) => el.style.transform), { timeout: 10_000 }).not.toBe(early);
    await expect(page.locator(".scene-card-answer")).toBeVisible();
  });

  test("3D objects explain themselves on hover", async ({ page }) => {
    await page.goto("/");
    await page.locator("#how-it-works ol > li").nth(2).scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    await page.locator("[data-scene-tile]").nth(41).hover({ force: true });
    const tip = page.getByRole("tooltip");
    await expect(tip).toBeVisible();
    await expect(tip).toContainText(/chunk|help doc|Source/);
  });

  test("works without WebGL (CSS 3D only)", async ({ page }) => {
    await page.addInitScript(() => {
      const orig = HTMLCanvasElement.prototype.getContext;
      // @ts-expect-error -- test override: report no WebGL support at all
      HTMLCanvasElement.prototype.getContext = function (type: string, ...rest: unknown[]) {
        if (type === "webgl" || type === "webgl2" || type === "experimental-webgl") return null;
        return orig.call(this, type, ...rest);
      };
    });
    await page.goto("/");
    await expect(page.locator("[data-scene=css3d]")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("[data-scene-tile]")).toHaveCount(96);
    await expect(page.locator("#how-it-works canvas")).toHaveCount(0);
  });

  test("chunker demo runs the real chunker", async ({ page }) => {
    await page.goto("/");
    const input = page.getByLabel("Paste or edit a help doc");
    await input.scrollIntoViewIfNeeded();
    await expect(page.getByText(/→ \d+ chunks?/)).toContainText("2 chunks");
    await input.fill("Short note.");
    await expect(page.getByText(/→ \d+ chunks?/)).toContainText("1 chunk");
  });

  test("citation markers point at their source passage", async ({ page }) => {
    await page.goto("/");
    const cite = page.locator("#features").getByRole("button", { name: "1", exact: true });
    await cite.scrollIntoViewIfNeeded();
    await cite.focus();
    await expect(page.locator("#cite-src-0")).toHaveClass(/border-accent/);
  });
});
