import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async () => {
    const messages: Record<string, string> = {
      staffVerdict: "Staff Verdict",
      theGood: "The Good",
      theBad: "The Bad",
      whoItsFor: "Who it's for",
      whoItsNotFor: "Who it's not for",
      topAlternatives: "Top alternatives",
    };

    return (key: string) => messages[key] ?? key;
  }),
}));

vi.mock(
  "~/app/[locale]/(pages)/gear/_components/manage-staff-verdict-modal",
  () => ({
    ManageStaffVerdictModal: () =>
      createElement("button", { type: "button" }, "Manage Staff Verdict"),
  }),
);

import { StaffVerdictSection } from "~/app/[locale]/(pages)/gear/_components/staff-verdict-section";

describe("StaffVerdictSection", () => {
  it("spans a single pros or cons card across the full row", async () => {
    const html = renderToStaticMarkup(
      await StaffVerdictSection({
        slug: "canon-eos-r6-mark-iii",
        verdict: {
          pros: ["32 Megapixel Sensor"],
        },
      }),
    );

    expect(html).toContain("The Good");
    expect(html).toContain("md:col-span-2");
    expect(html).not.toContain("The Bad");
  });

  it("spans a single who-it-is-for card across the full row", async () => {
    const html = renderToStaticMarkup(
      await StaffVerdictSection({
        slug: "canon-eos-r6-mark-iii",
        verdict: {
          whoFor: "Hybrid creators",
        },
      }),
    );

    expect(html).toContain("Who it&#x27;s for");
    expect(html).toContain("md:col-span-2");
    expect(html).not.toContain("Who it&#x27;s not for");
  });

  it("keeps paired rows in two columns when both cards exist", async () => {
    const html = renderToStaticMarkup(
      await StaffVerdictSection({
        slug: "canon-eos-r6-mark-iii",
        verdict: {
          pros: ["32 Megapixel Sensor"],
          cons: ["No internal ND"],
          whoFor: "Hybrid creators",
          notFor: "Budget shooters",
        },
      }),
    );

    expect(html).not.toContain("border-green-400/50 bg-green-400/5 p-3 md:col-span-2");
    expect(html).not.toContain("border-red-400/50 bg-red-400/5 p-3 md:col-span-2");
    expect(html).not.toContain("border-border rounded border p-3 md:col-span-2");
  });
});
