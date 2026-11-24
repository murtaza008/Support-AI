import { test, expect } from "@playwright/test";
import { DEMO_NIMBUS_ASSISTANT_ID, mockChat } from "./helpers";

test("playground streams an answer (chat mocked, no Gemini call)", async ({ page }) => {
  const answer = "You can request a refund within 30 days of purchase [1].";
  await mockChat(page, answer);
  await page.goto(`/assistants/${DEMO_NIMBUS_ASSISTANT_ID}/playground`);
  const box = page.getByRole("textbox").last();
  await box.fill("How do refunds work?");
  await box.press("Enter");
  await expect(page.getByText("How do refunds work?")).toBeVisible();
  await expect(page.getByText(/refund within 30 days of purchase/)).toBeVisible();
});
