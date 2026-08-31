import { expect, test } from "@playwright/test";

// Guards i18n plumbing end-to-end (the read sweep itself is en-only by
// design — see tests/playwright/utils/route-manifest.ts). The contract:
// a non-default locale prefix must (1) flip the <html lang> attribute via
// src/i18n routing (src/app/[locale]/layout.tsx passes params.locale
// straight to <html lang>) and (2) still resolve real seeded data through
// the same data path the en-only sweep exercises.
test("a non-default locale renders localized chrome with real data", async ({
  page,
}) => {
  await page.goto("/ja/gear");
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");

  // Gear names are not translated — seeded data proves the data path.
  // GearCard (src/components/gear/gear-card.tsx) splits brand/model into
  // sibling text nodes ("Nikon" / "Z6III"), so getByText("Nikon Z6III")
  // never matches a single text node; the rendered <Link>'s accessible
  // name concatenates brand + model (+ thumbnail alt), so role "link"
  // finds the seeded gear card by name as a substring — same marker style
  // as the /gear entry in tests/playwright/utils/route-manifest.ts.
  await expect(
    page.getByRole("link", { name: "Nikon Z6III" }).first(),
  ).toBeVisible();
});
