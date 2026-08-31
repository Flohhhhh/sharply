import { expect, test } from "@playwright/test";

import { delayNavigation } from "../utils/delay-navigation";

// Pending-state timing is calibrated for desktop chromium; other engines and
// mobile viewports race prefetch/soft-navigation. Phase-2 debt: docs/e2e-testing.md.
test.skip(
  ({ browserName, isMobile }) => browserName !== "chromium" || isMobile,
  "Desktop chromium only — see docs/e2e-testing.md cross-browser debt",
);

test("homepage news card shows pending feedback before navigating", async ({
  page,
}) => {
  await delayNavigation(page, (pathname) => pathname.includes("/news/"));

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
  await delayNavigation(page, (pathname) => pathname.includes("/gear/"));

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
  await delayNavigation(page, (pathname) => pathname.endsWith("/browse"));

  await page.goto("/");

  // Two browse CTAs exist (mobile hero + desktop "View all gear"); :visible
  // disambiguates on desktop, where the hero CTA is md:hidden. On mobile BOTH
  // are :visible (below-the-fold counts), which is one of the reasons this
  // file is desktop-chromium-only — a mobile variant needs its own selector.
  const browseCta = page.locator(
    '[data-link-button-root="true"][href$="/browse"]:visible',
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
  await delayNavigation(page, (pathname) => pathname.endsWith("/about"));

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
