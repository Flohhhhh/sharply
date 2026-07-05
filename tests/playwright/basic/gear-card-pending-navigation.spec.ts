import { expect, test } from "@playwright/test";

test("browse gear card shows pending feedback before navigating to detail", async ({
  page,
}) => {
  test.slow();

  let delayedDocumentNavigation = false;

  await page.route("**/gear/**", async (route) => {
    if (
      !delayedDocumentNavigation &&
      route.request().resourceType() === "document"
    ) {
      delayedDocumentNavigation = true;
      await new Promise((resolve) => setTimeout(resolve, 350));
    }

    await route.continue();
  });

  await page.goto("/browse");

  const firstGearCard = page
    .locator('[data-gear-card-link="true"][href^="/gear/"]')
    .first();
  await expect(firstGearCard).toBeVisible();
  const href = await firstGearCard.getAttribute("href");

  await firstGearCard.click();

  await expect(
    firstGearCard.locator('[data-gear-card-pending="true"]'),
  ).toBeVisible();
  await expect(
    firstGearCard.locator('[data-gear-card-pending-overlay="true"]'),
  ).toBeVisible();

  expect(href).toMatch(/^\/gear\/.+/);
});
