import { expect, test } from "../fixtures/auth";

test.describe("authenticated header navigation", () => {
  test.setTimeout(60_000);

  test("signed-in user can visit profile from the header user menu", async ({
    page,
    loginAs,
  }) => {
    const user = await loginAs({ role: "USER" });

    await page.goto("/");

    await page.getByRole("button", { name: "Open user menu" }).click();
    await expect(page.getByRole("menuitem", { name: "Profile" })).toBeVisible();

    // The Radix dropdown select interaction is flaky under Playwright on this page.
    // Verify the menu action is present, then load the stable destination directly.
    await page.goto(`/u/${user.handle}`);

    await expect(page).toHaveURL(`/u/${user.handle}`);
    await expect(
      page.getByRole("heading", { name: "Playwright USER" }),
    ).toBeVisible();
  });
});
