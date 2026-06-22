import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(
  path.join(process.cwd(), "src/components/gear/manage-colorways-modal.tsx"),
  "utf8",
);

describe("ManageColorwaysModal reset controls", () => {
  it("defaults reset confirmation to the default color and exposes alternate options", () => {
    expect(source.match(/<AlertDialogTrigger asChild>/g)).toHaveLength(2);
    expect(source).toContain('{t("confirmReset")}');
    expect(source).toContain('<RotateCcw data-icon="inline-start" />');
    expect(source).toContain('size="sm"');
    expect(source).not.toContain('{colorways.length ? t("defaultHint") : t("enableHint")}');
    expect(source).toContain('useState<ResetDialogMode>("applyDefaultColor")');
    expect(source).toContain('value="applyDefaultColor"');
    expect(source).toContain('value="applyOtherColor"');
    expect(source).toContain('value="keepGearImages"');
    expect(source).toContain('await reset("applyColorway", colorwayId);');
    expect(source).toContain('await reset("keepGearImages");');
    expect(source).toContain('resetMode === "applyOtherColor"');
    expect(source).toContain('{t("applyOtherColor")}');
    expect(source).toContain('{t("keepGearImagesDescription")}');
    expect(source).toContain('{t("applyColorwayDescription")}');
    expect(source).toContain('{t("chooseColorway")}');
  });

  it("renders add color as a compact inline row instead of a separate form block", () => {
    expect(source).toContain("<AddColorwayRow");
    expect(source).toContain('size="icon"');
    expect(source).toContain('border border-dashed p-3 shadow-sm');
    expect(source).not.toContain("onApplySwatch");
    expect(source).not.toContain('{colorways.length ? t("add") : t("enable")}');
  });
});
