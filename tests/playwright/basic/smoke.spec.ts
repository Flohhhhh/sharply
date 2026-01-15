import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

test.describe("smoke", () => {
  test("landing renders hero and search", async ({ page }) => {
    await page.goto(`${baseUrl}/`);

    // Ensure headline and search surface render.
    await expect(
      page.getByRole("heading", {
        name: "Real specs, real reviews, real fast.",
      }),
    ).toBeVisible();
    await expect(page.getByLabel("Global search")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Open command palette" }),
    ).toBeVisible();
  });

  test("landing CTA routes to browse hub", async ({ page }) => {
    await page.goto(`${baseUrl}/`);

    // CTA should take users to the browse hub which shows the catalog heading.
    const browseCta = page.getByRole("link", { name: "View all gear" });
    await expect(browseCta).toBeVisible();
    await browseCta.click();
    await expect(page).toHaveURL(/\/browse/);
    await expect(page.getByRole("heading", { name: "All Gear" })).toBeVisible();
  });

  test("browse hub surfaces key sections", async ({ page }) => {
    await page.goto(`${baseUrl}/browse`);

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
    await page.goto(`${baseUrl}/about`);

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
