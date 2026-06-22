import { expect, test } from "@playwright/test";

const colorwayGearSlug = process.env.PLAYWRIGHT_COLORWAY_GEAR_SLUG;

test.describe("gear colorways", () => {
  test.skip(
    !colorwayGearSlug,
    "Set PLAYWRIGHT_COLORWAY_GEAR_SLUG to an explicit multi-colorway fixture",
  );

  test("color pills move the public carousel and expose active state", async ({
    page,
  }) => {
    await page.goto(`/gear/${colorwayGearSlug}`);
    const group = page.getByRole("group", { name: "Available colors" });
    await expect(group).toBeVisible();
    const pills = group.getByRole("button");
    await expect(pills).toHaveCount(2);
    await pills.nth(1).click();
    await expect(pills.nth(1)).toHaveAttribute("aria-pressed", "true");
  });

  test("editors can open the color and image managers", async ({ page }) => {
    await page.goto("/api/dev-login");
    await page.goto(`/gear/${colorwayGearSlug}`);
    await page.getByRole("button", { name: "Manage Colors" }).click();
    await expect(
      page.getByRole("dialog", { name: "Manage Colors" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Manage Images" }).click();
    await expect(
      page.getByRole("dialog", { name: "Manage Gear Images" }),
    ).toBeVisible();
  });
});
