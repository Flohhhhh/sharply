import { test } from "@playwright/test";

import { expectPageRenders } from "../utils/expect-page-renders";
import { STORAGE_STATE_PATH } from "../utils/auth";
import { routesForSpec } from "../utils/route-manifest";

test.use({ storageState: STORAGE_STATE_PATH });

for (const route of routesForSpec("auth-gated")) {
  test(`renders ${route.path}`, async ({ page }) => {
    await expectPageRenders(page, route);
  });
}
