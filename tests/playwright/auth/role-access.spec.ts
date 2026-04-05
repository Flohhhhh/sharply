import { expect, test } from "../fixtures/auth";

test.describe("authenticated role access", () => {
  test.setTimeout(60_000);

  test("editor can access recommended lenses admin page", async ({
    page,
    loginAs,
  }) => {
    await loginAs({ role: "EDITOR" });

    await page.goto("/admin/recommended-lenses");

    await expect(
      page.getByRole("heading", { name: "Recommended Lenses — Admin" }),
    ).toBeVisible();
  });

  test("admin can access private admin page", async ({ page, loginAs }) => {
    await loginAs({ role: "ADMIN" });

    await page.goto("/admin/private");

    await expect(page.getByText("Create Invite")).toBeVisible();
    await expect(page.getByText("Notifications")).toBeVisible();
  });

  test("regular users are denied access to private admin page", async ({
    page,
    loginAs,
  }) => {
    await loginAs({ role: "USER" });

    await page.goto("/admin/private");

    await expect(
      page.getByRole("heading", { name: "Access denied" }),
    ).toBeVisible();
  });
});
