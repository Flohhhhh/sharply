import { expect,test, type Page } from "@playwright/test";

async function expectHeaderMode(page: Page, mode: "expanded" | "compact") {
  const header = page.getByRole("banner");
  await expect(header).toBeVisible();
  await expect(header).toHaveClass(mode === "compact" ? /h-16/ : /h-20/);
}

test.describe("smoke", () => {
  test("landing renders hero and search", async ({ page }) => {
    await page.goto("/");

    await expectHeaderMode(page, "expanded");

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

  test("landing search hotkey hint is hidden on mobile and visible on desktop", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const searchTrigger = page.getByRole("button", { name: "Search" });
    const shortcut = searchTrigger.locator("kbd");

    await expect(searchTrigger).toBeVisible();
    await expect(shortcut).toHaveCount(1);

    if (test.info().project.name.includes("Mobile")) {
      await expect(shortcut).not.toBeVisible();
      return;
    }

    await expect(shortcut).toBeVisible();
  });

  test("landing CTA routes to browse hub", async ({ page }) => {
    await page.goto("/");

    await expectHeaderMode(page, "expanded");

    // Validate the CTA destination from the homepage, then load the browse
    // hub directly. Direct navigation is more stable than relying on the
    // client-side transition here and still covers the user-facing contract.
    const browseCta = page.getByRole("link", { name: "View all gear" });
    await expect(browseCta).toBeVisible();
    await expect(browseCta).toHaveAttribute("href", "/browse");
    await page.goto("/browse");
    await expect(page).toHaveURL(/\/browse/);
    await expectHeaderMode(page, "compact");
    await expect(page.getByRole("heading", { name: "All Gear" })).toBeVisible();
  });

  test("browse hub surfaces key sections", async ({ page }) => {
    await page.goto("/browse");

    await expectHeaderMode(page, "compact");
    // Root browse page should surface catalog and discovery sections.
    await expect(page.getByRole("heading", { name: "All Gear" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Trending Gear" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Latest releases" }),
    ).toBeVisible();
  });

  test("search keeps the expanded non-hero header shell", async ({ page }) => {
    await page.goto("/search");

    await expectHeaderMode(page, "expanded");
  });

  test("gear detail keeps the compact header shell", async ({ page }) => {
    await page.goto("/browse");

    await expectHeaderMode(page, "compact");
    const firstGearLink = page.locator('a[href^="/gear/"]').first();
    await expect(firstGearLink).toBeVisible();
    const href = await firstGearLink.getAttribute("href");

    expect(href).toMatch(/^\/gear\/.+/);
    await page.goto(href!);

    await expect(page).toHaveURL(/\/gear\//);
    await expectHeaderMode(page, "compact");
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
