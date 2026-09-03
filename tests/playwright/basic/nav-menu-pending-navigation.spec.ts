import { expect, test } from "@playwright/test";

import { delayNavigation } from "../utils/delay-navigation";

// Pending-state timing is calibrated for desktop chromium; other engines and
// mobile viewports race prefetch/soft-navigation. Phase-2 debt: docs/e2e-testing.md.
test.skip(
  ({ browserName, isMobile }) => browserName !== "chromium" || isMobile,
  "Desktop chromium only — see docs/e2e-testing.md cross-browser debt",
);

test("Gear dropdown centers pending feedback over only the clicked card", async ({
  page,
}) => {
  test.slow();

  // Installed before goto: the home page prefetches nav links immediately on
  // load, so a route added afterwards can miss the prefetch and the click
  // resolves instantly with no observable pending state.
  await delayNavigation(page, (pathname) => pathname.endsWith("/gear"), 500);

  await page.goto("/");

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
