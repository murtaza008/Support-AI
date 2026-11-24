import { test, expect, type Page } from "@playwright/test";
import { DEMO_NIMBUS_ASSISTANT_ID, expectAccessible, mockChat, themes, useTheme } from "./helpers";

// Chat is mocked: no Gemini calls and nothing is written to the database.
const ANSWER = "You can request a refund within 30 days of purchase [1].";

async function open(page: Page) {
  await mockChat(page, ANSWER);
  await page.goto(`/assistants/${DEMO_NIMBUS_ASSISTANT_ID}/playground`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/nimbus help bot/i, { timeout: 30_000 });
}

async function ask(page: Page, text: string) {
  const box = page.getByRole("textbox", { name: /^message/i });
  await box.fill(text);
  await box.press("Enter");
  await expect(page.getByText(/refund within 30 days of purchase/)).toBeVisible();
}

test("streams an answer and turns [1] into a source chip", async ({ page }) => {
  await open(page);
  await ask(page, "How do refunds work?");
  await expect(page.getByText("How do refunds work?")).toBeVisible();
  const chip = page.getByRole("button", { name: "Source 1: Refund policy" });
  await expect(chip).toBeVisible();
  await chip.hover();
  await expect(page.getByText("82%").first()).toBeVisible();
  // The sources panel lists the passage behind the answer.
  const sources = page.getByRole("complementary", { name: "Sources" });
  await expect(sources.getByText("Refund policy")).toBeVisible();
});

test("Shift+Enter adds a line instead of sending", async ({ page }) => {
  await open(page);
  const box = page.getByRole("textbox", { name: /^message/i });
  await box.fill("first line");
  await box.press("Shift+Enter");
  await box.type("second line");
  await expect(box).toHaveValue("first line\nsecond line");
  await expect(page.getByText(/refund within 30 days/)).toHaveCount(0);
});

test("New chat clears the conversation", async ({ page }) => {
  await open(page);
  await ask(page, "How do refunds work?");
  await page.getByRole("button", { name: "New chat" }).click();
  await expect(page.getByText(/refund within 30 days/)).toHaveCount(0);
  await expect(page.getByText("Ask what a customer would ask")).toBeVisible();
});

for (const theme of themes) {
  test(`playground passes axe before and after an answer (${theme})`, async ({ page }) => {
    await useTheme(page, theme);
    await open(page);
    await expectAccessible(page, `playground empty (${theme})`);
    await ask(page, "How do refunds work?");
    await expectAccessible(page, `playground answered (${theme})`);
    await page.getByRole("button", { name: "Source 1: Refund policy" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expectAccessible(page, `source reader (${theme})`);
  });
}
