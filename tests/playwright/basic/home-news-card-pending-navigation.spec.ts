import { expect, test } from "@playwright/test";

test("homepage news card shows pending feedback before navigating", async ({
  page,
}) => {
  let delayedDocumentNavigation = false;

  await page.route("**/news/**", async (route) => {
    if (
      !delayedDocumentNavigation &&
      route.request().resourceType() === "document"
    ) {
      delayedDocumentNavigation = true;
      await new Promise((resolve) => setTimeout(resolve, 350));
    }

    await route.continue();
  });

  await page.goto("/");

  const firstNewsCard = page
    .locator('[data-home-news-card-link="true"][href^="/news/"]')
    .first();
  await expect(firstNewsCard).toBeVisible();

  await firstNewsCard.click();

  await expect(
    firstNewsCard.locator('[data-home-news-card-pending="true"]'),
  ).toBeVisible();
  await expect(
    firstNewsCard.locator('[data-home-news-card-pending-overlay="true"]'),
  ).toBeVisible();
});

test("homepage trending row shows pending feedback before navigating", async ({
  page,
}) => {
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

  await page.goto("/");

  const firstTrendingRow = page
    .locator('[data-trending-row-link="true"][href^="/gear/"]')
    .first();
  await expect(firstTrendingRow).toBeVisible();

  await firstTrendingRow.click();

  await expect(
    firstTrendingRow.locator('[data-trending-row-pending="true"]'),
  ).toBeVisible();
  await expect(
    firstTrendingRow.locator('[data-trending-row-pending-overlay="true"]'),
  ).toBeVisible();
});

test("homepage browse CTA shows pending feedback before navigating", async ({
  page,
}) => {
  let delayedDocumentNavigation = false;

  await page.route("**/browse", async (route) => {
    if (
      !delayedDocumentNavigation &&
      route.request().resourceType() === "document"
    ) {
      delayedDocumentNavigation = true;
      await new Promise((resolve) => setTimeout(resolve, 350));
    }

    await route.continue();
  });

  await page.goto("/");

  const browseCta = page.locator(
    '[data-link-button-root="true"][href$="/browse"]',
  );
  await expect(browseCta).toBeVisible();

  await browseCta.click();

  await expect(browseCta).toHaveAttribute("data-link-button-loading", "true");
  await expect(
    browseCta.locator('[data-link-button-pending="true"]'),
  ).toBeVisible();
});

test("homepage learn more CTA shows pending feedback before navigating", async ({
  page,
}) => {
  let delayedDocumentNavigation = false;

  await page.route("**/about", async (route) => {
    if (
      !delayedDocumentNavigation &&
      route.request().resourceType() === "document"
    ) {
      delayedDocumentNavigation = true;
      await new Promise((resolve) => setTimeout(resolve, 350));
    }

    await route.continue();
  });

  await page.goto("/");

  const learnMoreCta = page.locator(
    '[data-link-button-root="true"][href$="/about"]',
  );
  await expect(learnMoreCta).toBeVisible();

  await learnMoreCta.click();

  await expect(learnMoreCta).toHaveAttribute(
    "data-link-button-loading",
    "true",
  );
  await expect(
    learnMoreCta.locator('[data-link-button-pending="true"]'),
  ).toBeVisible();
});
