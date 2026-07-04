import { expect,test } from "@playwright/test";
import { localeCookieName } from "~/i18n/config";

test.describe("routing and auth", () => {
  test("keeps default-locale routes canonical and honors locale-cookie redirects", async ({
    page,
  }) => {
    await page.goto("/about");
    await expect(page).toHaveURL(/\/about$/);
    await expect(
      page.getByRole("heading", { name: "Photography for Everyone" }),
    ).toBeVisible();

    await page.goto("/en/about");
    await expect(page).toHaveURL(/\/about$/);

    await page.context().addCookies([
      {
        name: localeCookieName,
        value: "ja",
        url: "http://localhost:3000",
      },
    ]);
    await page.goto("/about");
    await expect(page).toHaveURL(/\/ja\/about$/);
  });

  test("gated profile routes redirect to sign-in and dev-login restores access", async ({
    page,
  }) => {
    test.slow();

    await page.goto("/profile/settings");
    await expect(page).toHaveURL(/\/auth\/signin\?callbackUrl=/);

    await page.goto("/api/dev-login");
    await expect(page).toHaveURL(/\/$/);

    await page.goto("/profile/settings");
    await expect(page).toHaveURL(/\/profile\/settings$/);
    await expect(
      page.getByRole("heading", { name: "Account Settings" }),
    ).toBeVisible();

    await page.goto("/profile");
    await expect(page).toHaveURL(/\/u\/.+/);
  });

  test("browse can navigate into a brand route", async ({ page }) => {
    await page.goto("/browse");

    const brandLink = page.locator('a[href^="/browse/"]').first();
    await expect(brandLink).toBeVisible();
    const href = await brandLink.getAttribute("href");

    expect(href).toMatch(/^\/browse\/[^/]+$/);
    await page.goto(href!);

    await expect(page).toHaveURL(/\/browse\/[^/]+$/);
    await expect(page.getByRole("heading").first()).toBeVisible();
  });

  test("cms route responds without a server error", async ({ page }) => {
    const response = await page.goto("/cms");

    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(500);
    await expect(page).toHaveURL(/\/(cms|auth\/signin)/);
  });
});
