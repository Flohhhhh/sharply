import { expect, test } from "@playwright/test";

test("browse list view persists after a reload", async ({ page }) => {
  await page.goto("/browse");

  await page.getByRole("button", { name: "List view" }).click();
  await expect(page.getByRole("table")).toBeVisible();

  await page.reload();
  await expect(page.getByRole("table")).toBeVisible();
});

test("search can switch its loaded results into list view", async ({
  page,
}) => {
  await page.goto("/search");

  await page.getByRole("button", { name: "List view" }).click();
  await expect(page.getByRole("table")).toBeVisible();
});
