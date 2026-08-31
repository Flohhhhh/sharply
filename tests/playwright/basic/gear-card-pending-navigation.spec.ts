import { expect, test } from "@playwright/test";

import { delayNavigation } from "../utils/delay-navigation";

// Pending-state timing is calibrated for desktop chromium; other engines and
// mobile viewports race prefetch/soft-navigation. Phase-2 debt: docs/e2e-testing.md.
test.skip(
  ({ browserName, isMobile }) => browserName !== "chromium" || isMobile,
  "Desktop chromium only — see docs/e2e-testing.md cross-browser debt",
);

test("browse gear card shows pending feedback before navigating to detail", async ({
  page,
}) => {
  test.slow();

  await delayNavigation(page, (pathname) => pathname.includes("/gear/"));

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
