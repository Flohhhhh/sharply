import { expect, test } from "@playwright/test";

test("browse list view persists after a reload", async ({ page }) => {
  await page.goto("/browse");

  await page.getByRole("radio", { name: "List view" }).click();
  await expect(page.getByRole("table")).toBeVisible();

  await page.reload();
  await expect(page.getByRole("table")).toBeVisible();
});

test("search can switch its loaded results into list view", async ({
  page,
}) => {
  await page.goto("/search");

  await page.getByRole("radio", { name: "List view" }).click();
  await expect(page.getByRole("table")).toBeVisible();
});

test("search loading skeleton uses the saved list view", async ({ page }) => {
  let releaseSearch!: () => void;
  const searchResponse = new Promise<void>((resolve) => {
    releaseSearch = resolve;
  });

  await page.addInitScript(() => {
    window.localStorage.setItem("sharply:gear-results-view", "list");
  });
  await page.route("**/api/search?**", async (route) => {
    await searchResponse;
    await route.fulfill({
      json: { results: [], total: 0, totalPages: 0, page: 1, pageSize: 24 },
    });
  });

  await page.goto("/search?q=nikon", { waitUntil: "domcontentloaded" });
  await expect(
    page.locator('[data-testid="search-results-skeleton"][data-view="list"]'),
  ).toBeVisible();

  releaseSearch();
});

test("search loading skeleton defaults to grid without a saved preference", async ({
  page,
}) => {
  let releaseSearch!: () => void;
  const searchResponse = new Promise<void>((resolve) => {
    releaseSearch = resolve;
  });

  await page.route("**/api/search?**", async (route) => {
    await searchResponse;
    await route.fulfill({
      json: { results: [], total: 0, totalPages: 0, page: 1, pageSize: 24 },
    });
  });

  await page.goto("/search?q=nikon", { waitUntil: "domcontentloaded" });
  await expect(
    page.locator('[data-testid="search-results-skeleton"][data-view="grid"]'),
  ).toBeVisible();

  releaseSearch();
});

test("search applies and clears specification filters by gear type", async ({
  page,
}) => {
  test.skip(
    test.info().project.name.includes("Mobile"),
    "Desktop only: mobile viewports expose filters through a different UI",
  );

  await page.goto("/search");

  await page.getByRole("radio", { name: "Lens", exact: true }).check();
  await page.getByLabel("Focal length").fill("85");
  await expect(page).not.toHaveURL(/focalIncludes/);
  await page.getByLabel("Focal length").press("Tab");
  await page.getByLabel("Has autofocus").check();
  await expect(page).toHaveURL(/focalIncludes=85/);
  await expect(page).toHaveURL(/hasAutofocus=true/);

  await page.getByRole("radio", { name: "Camera", exact: true }).check();
  await expect(page).not.toHaveURL(/focalIncludes/);
  await expect(page).not.toHaveURL(/hasAutofocus/);

  await page.getByLabel("Minimum ISO").click();
  await page.getByRole("option", { name: "ISO 100", exact: true }).click();
  await page.getByLabel("Maximum ISO").click();
  await expect(
    page.getByRole("option", { name: "ISO 64", exact: true }),
  ).toHaveAttribute("data-disabled", "");
  await page.getByRole("option", { name: "ISO 25600", exact: true }).click();
  await page.getByLabel("Has IBIS").check();
  await expect(page).toHaveURL(/isoMin=100/);
  await expect(page).toHaveURL(/isoMax=25600/);
  await expect(page).toHaveURL(/hasIbis=true/);
});

test("search displays reversed ISO URL bounds in normalized order", async ({
  page,
}) => {
  await page.goto("/search?gearType=camera&isoMin=25600&isoMax=100");

  await expect(page.getByLabel("Minimum ISO")).toContainText("ISO 100");
  await expect(page.getByLabel("Maximum ISO")).toContainText("ISO 25600");
});

test("mobile search exposes filters in a drawer", async ({ page }) => {
  test.skip(!test.info().project.name.includes("Mobile"), "Mobile only");

  await page.goto("/search");
  await page.getByRole("button", { name: "Filters", exact: true }).click();

  const drawer = page.getByRole("dialog");
  await expect(drawer).toBeVisible();
  await drawer.getByRole("radio", { name: "Lens", exact: true }).check();
  await drawer.getByLabel("Focal length").fill("85");
  await drawer.getByLabel("Focal length").press("Tab");

  await expect(page).toHaveURL(/focalIncludes=85/);
});
