import { expect, test, type Page } from "@playwright/test";
import postgres from "postgres";

import { STORAGE_STATE_PATH } from "./utils/auth";

test.use({ storageState: STORAGE_STATE_PATH });
test.setTimeout(90_000);

const READ_ONLY_GEAR_PATH = "/gear/nikon-z6iii";
const SUBMISSION_GEAR_PATH = "/gear/canon-eos-r6-mark-iii";
const PENDING_SUBMISSION_GEAR_PATH = "/gear/nikon-zr";

async function deletePendingFixtureProposal(
  proposalId?: string,
): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required for E2E cleanup");

  const sql = postgres(databaseUrl, { max: 1 });
  try {
    if (proposalId) {
      await sql`
        delete from app.gear_edits
        where id = ${proposalId} and status = 'PENDING'
      `;
      return;
    }

    await sql`
      delete from app.gear_edits as edit
      using app.gear as fixture, app."user" as submitter
      where edit.gear_id = fixture.id
        and edit.created_by_id = submitter.id
        and fixture.slug = 'nikon-zr'
        and submitter.email = 'dev@sharply.local'
        and edit.status = 'PENDING'
    `;
  } finally {
    await sql.end();
  }
}

async function openInterceptedEditModal(
  page: Page,
  gearPath = READ_ONLY_GEAR_PATH,
): Promise<void> {
  const editPath = `${gearPath}/edit`;
  await page.goto(gearPath);
  await page.getByRole("link", { name: "Suggest Edit" }).first().click();
  await expect(page).toHaveURL(new RegExp(`${editPath}(?:\\?|$)`), {
    timeout: 30_000,
  });
  await expect(page.getByRole("dialog")).toContainText("Edit Gear Item", {
    timeout: 30_000,
  });
}

async function expectEditModalClosed(page: Page): Promise<void> {
  await expect(
    page.getByRole("dialog").filter({ hasText: "Edit Gear Item" }),
  ).not.toBeVisible();
}

test("closes the intercepted gear editor with Escape", async ({ page }) => {
  await openInterceptedEditModal(page);

  await page.keyboard.press("Escape");

  await expect(page).toHaveURL(new RegExp(`${READ_ONLY_GEAR_PATH}/?$`));
  await expectEditModalClosed(page);
});

test("closes the intercepted gear editor from its overlay", async ({
  page,
}) => {
  await openInterceptedEditModal(page);

  await page.locator('[data-slot="dialog-overlay"]').click({
    position: { x: 5, y: 5 },
  });

  await expect(page).toHaveURL(new RegExp(`${READ_ONLY_GEAR_PATH}/?$`));
  await expectEditModalClosed(page);
});

test("browser Back clears the intercepted edit slot", async ({ page }) => {
  await openInterceptedEditModal(page);

  await page.goBack();

  await expect(page).toHaveURL(new RegExp(`${READ_ONLY_GEAR_PATH}/?$`));
  await expectEditModalClosed(page);
});

test("direct edit navigation keeps the full-page fallback", async ({
  page,
}) => {
  const editPath = `${READ_ONLY_GEAR_PATH}/edit`;
  await page.goto(editPath);

  await expect(page).toHaveURL(new RegExp(`${editPath}(?:\\?|$)`), {
    timeout: 30_000,
  });
  await expect(
    page.getByRole("heading", { name: "Edit Gear Item" }),
  ).toBeVisible();
  await expectEditModalClosed(page);
});

test("successful auto-approved edit closes the modal", async ({ page }) => {
  await openInterceptedEditModal(page, SUBMISSION_GEAR_PATH);

  const weightInput = page.locator("#weight");
  const currentWeight = Number(await weightInput.inputValue());
  expect(Number.isFinite(currentWeight)).toBe(true);
  await weightInput.fill(String(currentWeight + 1));

  await expect(page.getByText("Unsaved", { exact: true })).toBeVisible();
  await expect(page.locator("#edit-modal-auto-submit")).toBeChecked();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Submit suggestion?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Apply Now" }).click();

  await expect(page).toHaveURL(new RegExp(`${SUBMISSION_GEAR_PATH}/?$`), {
    timeout: 30_000,
  });
  await expectEditModalClosed(page);
});

test("pending edit closes the modal and reaches its success page", async ({
  page,
}) => {
  let proposalId: string | undefined;
  await deletePendingFixtureProposal();

  try {
    await openInterceptedEditModal(page, PENDING_SUBMISSION_GEAR_PATH);

    const weightInput = page.locator("#weight");
    const currentWeight = Number(await weightInput.inputValue());
    expect(Number.isFinite(currentWeight)).toBe(true);
    await weightInput.fill(String(currentWeight + 1));
    await page.locator("#edit-modal-auto-submit").uncheck();

    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page
      .getByRole("button", { name: "Confirm Submit", exact: true })
      .click();

    await expect(page).toHaveURL(/\/edit-success\?id=[^&]+$/, {
      timeout: 30_000,
    });
    proposalId = new URL(page.url()).searchParams.get("id") ?? undefined;
    expect(proposalId).toBeTruthy();
    await expect(page.getByText("Current status: PENDING")).toBeVisible();
    await expectEditModalClosed(page);
  } finally {
    await deletePendingFixtureProposal(proposalId);
  }
});
