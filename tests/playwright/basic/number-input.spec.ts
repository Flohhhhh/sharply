import { expect,test } from "@playwright/test";

test.describe("number input", () => {
  test("preserves decimal typing like 1.04", async ({ page }) => {
    await page.goto("/ui-demo");

    const numberInput = page.getByRole("textbox", { name: "Number" });
    await numberInput.click();
    await numberInput.pressSequentially("1.0");
    await expect(numberInput).toHaveValue("1.0");

    await numberInput.pressSequentially("4");
    await expect(numberInput).toHaveValue("1.04");
  });
});
