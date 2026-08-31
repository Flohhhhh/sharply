import type { Page } from "@playwright/test";

/**
 * Makes the next navigation to a matching path exhibit an observable pending
 * state. Next.js prefetches viewport links, so a click can resolve instantly
 * from the prefetch cache and the pending UI never renders — the historical
 * flake in the pending-navigation specs. Aborting router prefetches forces
 * the click to fetch, and that fetch (document or RSC) is delayed once.
 */
export async function delayNavigation(
  page: Page,
  matchesPath: (pathname: string) => boolean,
  delayMs = 350,
) {
  let delayed = false;
  await page.route(
    (url) => matchesPath(url.pathname),
    async (route) => {
      const headers = await route.request().allHeaders();
      if (headers["next-router-prefetch"]) {
        await route.abort("aborted");
        return;
      }
      const isNavigationFetch =
        route.request().resourceType() === "document" || "rsc" in headers;
      if (isNavigationFetch && !delayed) {
        delayed = true;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      await route.continue();
    },
  );
}
