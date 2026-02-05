import { expect, test } from "@playwright/test";
import { CONTACT_OPTIONS } from "~/app/(app)/(pages)/contact/contact-options";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

const options = CONTACT_OPTIONS.map((option) => ({
  label: option.label,
  reason: option.value,
  subject: option.subjectTemplate,
  showReferenceUrl: option.extraFields.includes("referenceUrl"),
  showCompany: option.extraFields.includes("company"),
}));

async function getContactContainer(page: import("@playwright/test").Page) {
  const drawer = page.locator('[data-slot="drawer-content"]').filter({
    hasText: "Contact Sharply",
  });
  if (
    await drawer
      .first()
      .isVisible()
      .catch(() => false)
  ) {
    return drawer.first();
  }

  return page.getByRole("dialog", { name: "Contact Sharply" });
}

test.describe("contact page", () => {
  test("option cards open modal with defaults", async ({ page }) => {
    await page.goto(`${baseUrl}/contact`);

    for (const option of options) {
      await page.getByRole("button", { name: option.label }).click();
      const container = await getContactContainer(page);
      await expect(container).toBeVisible();
      await expect(container.locator('input[name="reason"]')).toHaveValue(
        option.reason,
      );
      await expect(container.locator('input[name="subject"]')).toHaveValue(
        option.subject,
      );

      const referenceUrl = container.getByLabel("Reference URL");
      if (option.showReferenceUrl) {
        await expect(referenceUrl).toBeVisible();
      } else {
        await expect(referenceUrl).toHaveCount(0);
      }

      const company = container.getByLabel("Company");
      if (option.showCompany) {
        await expect(company).toBeVisible();
      } else {
        await expect(company).toHaveCount(0);
      }

      const cancelButton = container.getByRole("button", { name: "Cancel" });
      await cancelButton.scrollIntoViewIfNeeded();
      await cancelButton.click();
      await expect(container).toHaveCount(0);
    }
  });

  test("validation blocks empty submit", async ({ page }) => {
    await page.goto(`${baseUrl}/contact`);
    await page.getByRole("button", { name: "Data Errors" }).click();
    const container = await getContactContainer(page);
    await expect(container).toBeVisible();
    await container.getByLabel("Subject").fill("");
    await container.getByLabel("Message").fill("");
    const submitButton = container.getByRole("button", {
      name: "Send message",
    });
    await submitButton.scrollIntoViewIfNeeded();
    await submitButton.click();

    await expect(container.getByText("Name is required")).toBeVisible();
    await expect(container.getByText("Enter a valid email")).toBeVisible();
    await expect(container.getByText("Subject is required")).toBeVisible();
    await expect(
      container.getByText("Message must be at least 20 characters"),
    ).toBeVisible();
  });

  test("successful submit shows confirmation", async ({ page }) => {
    await page.route("**/api/contact", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto(`${baseUrl}/contact`);
    await page.getByRole("button", { name: "Data Errors" }).click();
    const container = await getContactContainer(page);
    await expect(container).toBeVisible();
    await container.getByLabel("Name").fill("Test User");
    await container.getByLabel("Email").fill("test@example.com");
    await container.getByLabel("Subject").fill("Data correction request");
    await container
      .getByLabel("Message")
      .fill("This is a test message long enough to submit.");
    const submitButton = container.getByRole("button", {
      name: "Send message",
    });
    await submitButton.scrollIntoViewIfNeeded();
    await submitButton.click();

    await expect(
      container.getByText(
        "Thanks for reaching out! Your message has been sent and we'll respond within a couple business days.",
      ),
    ).toBeVisible();
  });
});
