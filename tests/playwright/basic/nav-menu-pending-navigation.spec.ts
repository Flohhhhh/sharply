import { expect, test } from "@playwright/test";

test("Gear dropdown centers pending feedback over only the clicked card", async ({
  page,
}) => {
  test.slow();

  await page.goto("/");

  let delayedNavigation = false;
  await page.route("**/gear", async (route) => {
    if (!delayedNavigation) {
      delayedNavigation = true;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    await route.continue();
  });

  await page.getByRole("button", { name: "Gear" }).click();

  const browseCard = page.locator('[data-nav-card-link="true"][href="/gear"]');
  const collectionsCard = page.locator(
    '[data-nav-card-link="true"][href="/tags"]',
  );

  await expect(browseCard).toBeVisible();
  await browseCard.click();

  const overlay = browseCard.locator('[data-nav-card-pending-overlay="true"]');
  await expect(overlay).toBeVisible();
  await expect(overlay).toHaveCSS("align-items", "center");
  await expect(overlay).toHaveCSS("justify-content", "center");
  await expect(
    collectionsCard.locator('[data-nav-card-pending-overlay="true"]'),
  ).toHaveCount(0);
});
