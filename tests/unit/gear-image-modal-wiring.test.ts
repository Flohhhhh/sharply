import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

describe("GearImageModal rear view wiring", () => {
  it("keeps rear view camera-only while preserving rear-view wiring", () => {
    const source = read("src/components/modals/gear-image-modal.tsx");

    expect(source).toContain("gearType: GearType;");
    expect(source).toContain("currentRearViewUrl?: string;");
    expect(source).toContain(
      'type ImageType = "thumbnail" | "topView" | "rearView"',
    );
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
    expect(source).toContain("currentThumbnailUrl: displayedThumbnailUrl");
    expect(source).toContain("ogImageUrl = null");
    expect(source).toContain("actionSetGearThumbnail({");
    expect(source).toContain("actionSetGearColorwayImage({");
    expect(source).toContain('t("colorwayContextMissing")');
    expect(source).toContain("ogImageUrl,");
  });

  it("passes the gear id required by explicit colorway image actions", () => {
    const source = read("src/components/gear/gear-tools-dock/dock-buttons.tsx");

    expect(source).toContain("<GearImageModal");
    expect(source).toContain("gearId={gearId}");
    expect(source).toContain("currentColorways={colorways}");
  });

  it("places the color manager after the image manager in the dock", () => {
    const source = read("src/components/gear/gear-tools-dock/dock-buttons.tsx");

    expect(source.indexOf('id: "images"')).toBeLessThan(
      source.indexOf('id: "colorways"'),
    );
  });

  it("uses compact, higher-contrast shadcn tabs for explicit colorway image management", () => {
    const source = read("src/components/modals/gear-image-modal.tsx");

    expect(source).toContain("import { Tabs, TabsList, TabsTrigger }");
    expect(source).toContain(
      'TabsList className="h-auto max-w-full justify-start gap-1 overflow-x-auto rounded-md border border-input/70 bg-background/70 p-1 shadow-sm"',
    );
    expect(source).toContain(
      'className="h-8 rounded-sm px-3 text-xs font-semibold text-foreground/70 data-[state=active]:border-border data-[state=active]:bg-foreground/10 data-[state=active]:text-foreground data-[state=active]:shadow-none"',
    );
  });
});
