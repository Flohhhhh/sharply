import fs from "node:fs";
import path from "node:path";
import { describe,expect,it } from "vitest";

const projectRoot = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

describe("GearImageModal rear view wiring", () => {
  it("keeps rear view camera-only while preserving rear-view wiring", () => {
    const source = read("src/components/modals/gear-image-modal.tsx");

    expect(source).toContain("gearType: GearType;");
    expect(source).toContain("currentRearViewUrl?: string;");
    expect(source).toContain('type ImageType = "thumbnail" | "topView" | "rearView"');
    expect(source).toContain(
      'props.gearType === "CAMERA" || props.gearType === "ANALOG_CAMERA"',
    );
    expect(source).toContain("actionSetGearRearView");
    expect(source).toContain("actionClearGearRearView");
    expect(source).toContain('t("manageDescriptionNoRearView")');
    expect(source).toContain("supportsRearView ? (");
    expect(source).toContain('imageType="rearView"');
  });

  it("only auto-generates gear OG assets for the first front-view image", () => {
    const source = read("src/components/modals/gear-image-modal.tsx");

    expect(source).toContain("createGearOgImageFileFromSource");
    expect(source).toContain("shouldAutoGenerateGearOgImageOnThumbnailUpload");
    expect(source).toContain("currentThumbnailUrl: localThumbnailUrl");
    expect(source).toContain("ogImageUrl = null");
    expect(source).toContain("actionSetGearThumbnail({");
    expect(source).toContain("ogImageUrl,");
  });
});
