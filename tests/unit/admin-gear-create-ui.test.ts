import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  path.join(process.cwd(), "src/app/[locale]/(admin)/admin/gear-create.tsx"),
  "utf8",
);
const sidebarSource = readFileSync(
  path.join(process.cwd(), "src/app/[locale]/(admin)/admin/sidebar.tsx"),
  "utf8",
);

describe("admin gear creation modal wiring", () => {
  it("uses a two-step, type-aware form with inference and completeness inputs", () => {
    expect(source).toContain("setStep(2)");
    expect(source).toContain('gearType === "LENS"');
    expect(source).toContain("parseFocalLengthFromName");
    expect(source).toContain("parseApertureFromName");
    expect(source).toContain("initialCameraSpecs");
    expect(source).toContain("initialAnalogCameraSpecs");
    expect(source).toContain("initialFixedLensSpecs");
    expect(source).toContain("imageCircleSizeId");
    expect(source).toContain("mountIds");
  });

  it("keeps errors visible, disables loading inputs, and closes only on success", () => {
    expect(source).toContain("setSubmitError(message)");
    expect(source).toContain("<fieldset disabled={disabled}");
    expect(source).toContain("onCreated?.()");
    expect(source).toContain("toast.success");
    expect(source).toContain("duration: 15_000");
    expect(source).toContain("window.location.assign");
    expect(sidebarSource).toContain(
      "onCreated={() => setCreateGearOpen(false)}",
    );
  });

  it("labels fuzzy matches as possible duplicates and links to each match", () => {
    expect(source).toContain('t("possibleDuplicate")');
    expect(source).toContain('t("possibleDuplicateDescription")');
    expect(source).toContain("`/gear/${item.slug}`");
    expect(source).toContain('t("confirmDifferentProduct")');
  });
});
