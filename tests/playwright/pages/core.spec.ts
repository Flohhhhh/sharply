import { test } from "@playwright/test";

import { expectPageRenders } from "../utils/expect-page-renders";
import { routesForSpec } from "../utils/route-manifest";

for (const route of routesForSpec("core")) {
  test(`renders ${route.path}`, async ({ page }) => {
    await expectPageRenders(page, route);
  });
}
