import { expect,test } from "@playwright/test";

test.describe("smoke", () => {
  test("landing renders hero and search", async ({ page }) => {
    await page.goto("/");

    // Ensure headline and search trigger render, then opening search shows the dialog.
    await expect(
      page.getByRole("heading", {
        name: "Real specs, real reviews, real fast.",
      }),
    ).toBeVisible();
    const searchTrigger = page.getByRole("button", { name: "Search" });
    await expect(searchTrigger).toBeVisible();
    await searchTrigger.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page.getByRole("combobox", { name: "Search Sharply" }),
    ).toBeVisible();
  });

  test("landing CTA routes to browse hub", async ({ page }) => {
    await page.goto("/");

    // Validate the CTA destination from the homepage, then load the browse
    // hub directly. Direct navigation is more stable than relying on the
    // client-side transition here and still covers the user-facing contract.
    const browseCta = page.getByRole("link", { name: "View all gear" });
    await expect(browseCta).toBeVisible();
    await expect(browseCta).toHaveAttribute("href", "/browse");
    await page.goto("/browse");
    await expect(page).toHaveURL(/\/browse/);
    await expect(page.getByRole("heading", { name: "All Gear" })).toBeVisible();
  });

  test("browse hub surfaces key sections", async ({ page }) => {
    await page.goto("/browse");

    // Root browse page should surface catalog and discovery sections.
    await expect(page.getByRole("heading", { name: "All Gear" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Trending Gear" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Latest releases" }),
    ).toBeVisible();
  });

  test("about page loads mission content", async ({ page }) => {
    await page.goto("/about");

    // About page should explain the mission and show call-to-action.
    await expect(
      page.getByRole("heading", { name: "Photography for Everyone" }),
    ).toBeVisible();
    await expect(
      page.getByText("Photography knowledge made open and accessible", {
        exact: false,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "View the gear database" }),
    ).toBeVisible();
  });
});
