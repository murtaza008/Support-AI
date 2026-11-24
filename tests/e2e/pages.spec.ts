import { test, expect, type Page } from "@playwright/test";
import { expectAccessible, expectPage, themes, useTheme } from "./helpers";

// Read-only: dialogs are opened and cancelled, never submitted.

async function workspaceId(page: Page) {
  const ws = await (await page.request.get("/api/workspaces/current")).json();
  return ws.id as string;
}

for (const theme of themes) {
  test.describe(`dialogs (${theme})`, () => {
    test.beforeEach(async ({ page }) => useTheme(page, theme));

    test("assistants: create, edit, embed and delete dialogs pass axe", async ({ page }) => {
      await page.goto("/assistants");
      await expectPage(page, "Assistants");
      await expect(page.getByRole("heading", { name: "Nimbus Help Bot" })).toBeVisible({ timeout: 30_000 });

      await page.getByRole("button", { name: "New assistant" }).click();
      await expect(page.getByRole("dialog", { name: "New assistant" })).toBeVisible();
      await expectAccessible(page, `new assistant (${theme})`);
      await page.keyboard.press("Escape");

      await page.getByRole("button", { name: "More actions for Nimbus Help Bot" }).click();
      await page.getByRole("menuitem", { name: "Edit settings" }).click();
      await expect(page.getByRole("dialog", { name: /edit nimbus help bot/i })).toBeVisible();
      await expect(page.getByLabel("Instructions")).not.toBeEmpty({ timeout: 20_000 });
      await expectAccessible(page, `edit assistant (${theme})`);
      await page.keyboard.press("Escape");

      await page.getByRole("button", { name: "Embed" }).first().click();
      const embed = page.getByRole("dialog", { name: /on your website/i });
      await expect(embed.getByLabel("Embed code")).toContainText("data-assistant=");
      await expectAccessible(page, `embed (${theme})`);
      await page.keyboard.press("Escape");

      await page.getByRole("button", { name: "More actions for Nimbus Help Bot" }).click();
      await page.getByRole("menuitem", { name: "Delete" }).click();
      await expect(page.getByRole("dialog", { name: /delete “nimbus help bot”/i })).toBeVisible();
      await expectAccessible(page, `delete assistant (${theme})`);
      await page.getByRole("button", { name: "Cancel" }).click();
    });

    test("knowledge: add-document and delete dialogs pass axe", async ({ page }) => {
      await page.goto("/knowledge");
      await expectPage(page, "Knowledge");
      await page.getByRole("button", { name: "Add document" }).click();
      const dialog = page.getByRole("dialog", { name: "Add a document" });
      await expect(dialog).toBeVisible();
      await expectAccessible(page, `add document, paste (${theme})`);
      await dialog.getByRole("tab", { name: /upload a file/i }).click();
      await expect(dialog.getByText(/drop a pdf/i)).toBeVisible();
      await expectAccessible(page, `add document, file (${theme})`);
      await page.keyboard.press("Escape");

      await page.getByRole("button", { name: /^Delete / }).first().click();
      await expect(page.getByRole("dialog", { name: /^Delete “/ })).toBeVisible();
      await expectAccessible(page, `delete document (${theme})`);
      await page.getByRole("button", { name: "Cancel" }).click();
    });

    test("team: remove-member confirmation passes axe", async ({ page }) => {
      await page.goto("/team");
      await expectPage(page, "Team");
      const remove = page.getByRole("button", { name: /^Remove / }).first();
      await expect(remove).toBeVisible({ timeout: 30_000 });
      await remove.click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await expectAccessible(page, `remove member (${theme})`);
      await page.getByRole("button", { name: "Cancel" }).click();
    });
  });
}

test.describe("page behaviour", () => {
  test("knowledge filters by status and search, and ?doc= opens the reader", async ({ page }) => {
    await page.goto("/knowledge");
    await expectPage(page, "Knowledge");
    const rows = page.locator("tbody tr");
    await expect(rows.first()).toBeVisible({ timeout: 30_000 });
    const total = await rows.count();
    await page.getByLabel("Search documents").fill("refund");
    await expect(rows).not.toHaveCount(total);
    await expect(rows.first()).toContainText(/refund/i);
    await page.getByRole("radio", { name: /^Failed/ }).click();
    await expect(page.getByText(/no document matches/i)).toBeVisible();

    const docs = await (await page.request.get(`/api/documents?workspaceId=${await workspaceId(page)}`)).json();
    await page.goto(`/knowledge?doc=${docs[0].id}`);
    await expect(page.getByRole("dialog", { name: docs[0].name })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/^Passage 1/)).toBeVisible({ timeout: 20_000 });
  });

  test("conversations: ?c= opens a transcript with its citations", async ({ page }) => {
    await page.goto("/conversations");
    await expectPage(page, "Conversations");
    const list = await (await page.request.get(`/api/conversations?workspaceId=${await workspaceId(page)}`)).json();
    await page.goto(`/conversations?c=${list[0].id}`);
    const transcript = page.getByRole("list", { name: "Messages" });
    await expect(transcript.locator("li").first()).toBeVisible({ timeout: 30_000 });
    await expect(page.locator("[aria-current='true']")).toBeVisible();
  });

  test("team shows the permissions table and roles", async ({ page }) => {
    await page.goto("/team");
    await expectPage(page, "Team");
    await expect(page.getByRole("table", { name: "Permissions by role" })).toBeVisible();
    await expect(page.getByRole("list", { name: "Members" }).locator("li")).not.toHaveCount(0, { timeout: 30_000 });
  });

  test("an invalid invite link explains itself and passes axe", async ({ page }) => {
    await page.goto("/invite/not-a-real-token");
    await expect(page.getByRole("heading", { name: /doesn’t work/ })).toBeVisible({ timeout: 30_000 });
    await expectAccessible(page, "invalid invite");
  });
});
