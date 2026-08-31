import { expect, type Page } from "@playwright/test";

import { ERROR_BOUNDARY_TEXT, type Marker, type RouteEntry } from "./route-manifest";

function resolveMarker(page: Page, marker: Marker) {
  if ("role" in marker) return page.getByRole(marker.role, { name: marker.name });
  if ("testId" in marker) return page.getByTestId(marker.testId);
  return page.getByText(marker.text);
}

/**
 * The sweep's assertion contract (spec §Phase 2):
 * 1. marker visible — primary; proves routing -> service -> data ran
 * 2. error boundary absent — a late streamed error still fails the test
 * 3. response.ok() — secondary; streaming SSR sends 200 before late errors
 * Browser-side third-party requests are blocked (CI has dummy keys; the
 * sweep must not flake on unreachable hosts). Server-side external calls
 * can't be intercepted here — they already run against dummy keys in CI.
 */
export async function expectPageRenders(page: Page, route: RouteEntry) {
  await page.route(
    (url) => !["localhost", "127.0.0.1"].includes(url.hostname),
    (r) => r.abort(),
  );

  const response = await page.goto(route.path);

  await expect(
    resolveMarker(page, route.marker).first(),
    `marker missing on ${route.path}`,
  ).toBeVisible();
  await expect(
    page.getByText(ERROR_BOUNDARY_TEXT),
    `error boundary rendered on ${route.path}`,
  ).toHaveCount(0);
  expect(
    response?.ok(),
    `non-OK status on ${route.path}: ${response?.status()}`,
  ).toBe(true);
}
