import { expect, test, type Page } from "@playwright/test";

async function startDevelopmentSession(page: Page) {
  const response = await page.goto("/api/dev-login");
  if (!response || response.status() === 404) return false;
  await page.goto("/forum");
  return true;
}

test.describe("forum editor", () => {
  test("supports Markdown shortcuts and restores a draft", async ({ page }) => {
    if (!(await startDevelopmentSession(page))) test.skip();

    await page.getByRole("button", { name: "Start a discussion" }).click();

    const editor = page.locator(
      '[contenteditable="true"][aria-label="Post editor"]',
    );
    await expect(editor).toBeVisible();

    await editor.pressSequentially("# ");
    await editor.pressSequentially("A heading");
    await expect(editor.locator("h1")).toHaveText("A heading");

    await editor.press("Enter");
    await editor.pressSequentially("- ");
    await editor.pressSequentially("A bullet");
    await expect(editor.locator("ul li")).toHaveText("A bullet");

    await page.getByRole("button", { name: "Close composer" }).click();
    await page.getByRole("button", { name: "Open draft" }).click();
    await expect(editor).toContainText("A heading");
    await expect(editor).toContainText("A bullet");
  });

  test("publishes formatted content and renders it in the thread", async ({
    page,
  }) => {
    if (!(await startDevelopmentSession(page))) test.skip();

    await page.getByRole("button", { name: "Start a discussion" }).click();
    const title = `Forum editor ${Date.now()}`;
    await page.locator("#forum-thread-title").fill(title);

    const editor = page.locator(
      '[contenteditable="true"][aria-label="Post editor"]',
    );
    await editor.pressSequentially("# ");
    await editor.pressSequentially("Formatted heading");

    await page.getByRole("button", { name: "Publish discussion" }).click();
    await expect(page).toHaveURL(/\/forum\/t\//);
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(page.locator("article .prose h1")).toHaveText(
      "Formatted heading",
    );
  });
});
