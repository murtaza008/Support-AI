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

  test("loads the 3D scene when idle and moves through the story on scroll", async ({ page }) => {
    await page.goto("/");
    const stage = page.locator("#how-it-works canvas");
    await expect(stage).toHaveCount(1, { timeout: 15_000 });
    await page.locator("#how-it-works").scrollIntoViewIfNeeded();
    const steps = page.locator("#how-it-works ol > li");
    await expect(steps).toHaveCount(5);
    await steps.nth(4).scrollIntoViewIfNeeded();
    await expect(steps.nth(4).getByText("Answer from those passages, with sources")).toBeVisible();
  });

  test("3D objects explain themselves on hover", async ({ page }) => {
    await page.goto("/");
    const canvas = page.locator("#how-it-works canvas");
    await expect(canvas).toHaveCount(1, { timeout: 15_000 });
    await page.locator("#how-it-works ol > li").nth(2).scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    const box = (await canvas.boundingBox())!;
    const tip = page.getByRole("tooltip");
    // Sweep the pointer across the scene until it lands on an object.
    for (let y = 0.3; y <= 0.7 && !(await tip.isVisible()); y += 0.05) {
      for (let x = 0.3; x <= 0.7; x += 0.05) {
        await page.mouse.move(box.x + box.width * x, box.y + box.height * y);
        if (await tip.isVisible()) break;
      }
    }
    await expect(tip).toBeVisible();
    await expect(tip).toContainText(/chunk|help doc|Source/);
  });

  test("falls back to a still image without WebGL", async ({ page }) => {
    await page.addInitScript(() => {
      const orig = HTMLCanvasElement.prototype.getContext;
      // @ts-expect-error -- test override: report no WebGL support
      HTMLCanvasElement.prototype.getContext = function (type: string, ...rest: unknown[]) {
        if (type === "webgl" || type === "webgl2") return null;
        return orig.call(this, type, ...rest);
      };
    });
    await page.goto("/");
    await page.waitForTimeout(3000);
    await expect(page.locator("#how-it-works canvas")).toHaveCount(0);
    await expect(page.getByRole("img", { name: /answer card citing two/i })).toBeVisible();
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
