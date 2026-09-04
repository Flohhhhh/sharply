import { expect, test } from "@playwright/test";

import { STORAGE_STATE_PATH } from "./utils/auth";

test.use({ storageState: STORAGE_STATE_PATH });

test("gear editor starts without unsaved changes", async ({ page }) => {
  await page.goto("/gear/nikon-z6iii/edit");

  await expect(
    page.getByRole("heading", { name: "Edit Gear Item" }),
  ).toBeVisible();
  await expect(
    page.getByText("Unsaved", { exact: true }).locator(".."),
  ).toHaveClass(/opacity-0/);
});
