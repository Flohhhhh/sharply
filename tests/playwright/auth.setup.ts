import fs from "node:fs";
import path from "node:path";

import { expect, test as setup } from "@playwright/test";

import { STORAGE_STATE_PATH } from "./utils/auth";

setup("authenticate via dev-login bypass", async ({ page }) => {
  // Mints a session for dev@sharply.local (SUPERADMIN via e2e fixtures)
  // and redirects home. Requires DEV_AUTH=true on the server.
  await page.goto("/api/dev-login");
  await expect(page).toHaveURL(/\/$/);

  // Playwright does not create parent directories for storageState — without
  // this, a fresh checkout (no test-results/.auth/ yet) fails the setup
  // project with ENOENT instead of writing the shared storage state.
  fs.mkdirSync(path.dirname(STORAGE_STATE_PATH), { recursive: true });
  await page.context().storageState({ path: STORAGE_STATE_PATH });
});
