import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

test.describe("number input", () => {
  test("preserves decimal typing like 1.04", async ({ page }) => {
    await page.goto(`${baseUrl}/ui-demo`);

    const numberInput = page.getByRole("textbox", { name: "Number" });
    await numberInput.click();
    await numberInput.pressSequentially("1.0");
    await expect(numberInput).toHaveValue("1.0");

    await numberInput.pressSequentially("4");
    await expect(numberInput).toHaveValue("1.04");
  });
});
