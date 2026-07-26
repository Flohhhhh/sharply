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
    expect(source).toContain("currentLeftViewUrl?: string;");
    expect(source).toContain("currentRightViewUrl?: string;");
    expect(source).toContain('"leftView"');
    expect(source).toContain('"rightView"');
    expect(source).toContain(
      'props.gearType === "CAMERA" || props.gearType === "ANALOG_CAMERA"',
    );
    expect(source).toContain("actionSetGearRearView");
    expect(source).toContain("actionClearGearRearView");
    expect(source).toContain("actionSetGearLeftView");
    expect(source).toContain("actionClearGearLeftView");
    expect(source).toContain("actionSetGearRightView");
    expect(source).toContain("actionClearGearRightView");
    expect(source).toContain('t("manageDescriptionNoRearView")');
    expect(source).toContain("supportsSideViews ? (");
    expect(source).toContain('imageType="rearView"');
    expect(source).toContain('imageType="leftView"');
    expect(source).toContain('imageType="rightView"');
    expect(source).toContain('title={t("frontView")}');
    expect(source).toContain('title={t("topView")}');
    expect(source).toContain('title={t("leftView")}');
    expect(source).toContain('title={t("rightView")}');
    expect(source).toContain('title={t("perspectiveView")}');
    expect(source).toContain('title={t("orthographicView")}');
  });

  it("only auto-generates gear OG assets for the first front-view image", () => {
    const source = read("src/components/modals/gear-image-modal.tsx");

    expect(source).toContain("createGearOgImageFileFromSource");
    expect(source).toContain("shouldAutoGenerateGearOgImageOnThumbnailUpload");
    expect(source).toContain("currentThumbnailUrl: displayedThumbnailUrl");
    expect(source).toContain("actionSetGearThumbnail({");
    expect(source).toContain("actionSetGearColorwayImage({");
    expect(source).toContain('t("colorwayContextMissing")');
    expect(source).toContain("actionSetGearOgImage({");
    expect(source.indexOf("actionSetGearThumbnail({")).toBeLessThan(
      source.indexOf("actionSetGearOgImage({"),
    );
  });

  it("shows a review stage after upload and before persisting the image", () => {
    const source = read("src/components/modals/gear-image-modal.tsx");

    expect(source).toContain('"upload" | "review" | "save" | "delete"');
    expect(source).toContain('setProgressMode("review")');
    expect(source).toContain('t("reviewing")');
    expect(source.indexOf('setProgressMode("review")')).toBeLessThan(
      source.indexOf("actionSetGearColorwayImage({"),
    );
  });

  it("allocates progress through upload, review, then save", () => {
    const source = read("src/components/modals/gear-image-modal.tsx");

    expect(source).toContain("const UPLOAD_PROGRESS_END = 70;");
    expect(source).toContain("const REVIEW_PROGRESS_END = 85;");
    expect(source).toContain("const SAVE_PROGRESS_INCREMENT = 3;");
    expect(source).toContain('setCombinedProgress(UPLOAD_PROGRESS_END)');
    expect(source).toContain('setProgressMode("save")');
    expect(source).toContain("await animateSaveProgress()");
  });

  it("passes the gear id required by explicit colorway image actions", () => {
    const source = read("src/components/gear/gear-tools-dock/dock-buttons.tsx");

    expect(source).toContain("<GearImageModal");
    expect(source).toContain("gearId={gearId}");
    expect(source).toContain("currentColorways={colorways}");
  });

  it("supports controlled, triggerless callers without changing trigger-based use", () => {
    const source = read("src/components/modals/gear-image-modal.tsx");

    expect(source).toContain("open?: boolean;");
    expect(source).toContain("onOpenChange?: (open: boolean) => void;");
    expect(source).toContain("trigger?: ReactNode | null;");
    expect(source).toContain("const open = props.open ?? internalOpen;");
    expect(source).toContain("props.trigger !== null ? (");
    expect(source).toContain("const isTriggerless = props.trigger === null;");
    expect(source).toContain(
      'return isTriggerless ? null : <div>{statusT("loading")}</div>;',
    );
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
      'TabsList className="border-input/70 bg-background/70 h-auto max-w-full justify-start gap-1 overflow-x-auto rounded-md border p-1 shadow-sm"',
    );
    expect(source).toContain(
      'className="text-foreground/70 data-[state=active]:border-border data-[state=active]:bg-foreground/10 data-[state=active]:text-foreground h-8 rounded-sm px-3 text-xs font-semibold data-[state=active]:shadow-none"',
    );
  });

  it("supports drag-and-drop replacement and disables other slots while busy", () => {
    const source = read("src/components/modals/gear-image-modal.tsx");

    expect(source).toContain("const isBusy = isUploading || isUpdating");
    expect(source).toContain("const isDisabled = isBusy && !isActive");
    expect(source).toContain("pointer-events-none opacity-50");
    expect(source).toContain("onDrop={handleDrop}");
    expect(source).toContain("if (isBusy) return;");
    expect(source).toContain("disabled={isBusy}");
    expect(source).toContain("disabled={isBusy || !canDelete}");
    expect(source).toContain('className="mx-auto max-w-2xl"');
    expect(source).toContain('className="grid gap-6 md:grid-cols-4"');
    expect(source).toContain('mediaClassName="h-72"');
    expect(source).toContain('mediaClassName="h-36"');
    expect(source).toContain('className="min-h-10 space-y-2"');
    expect(source).toContain('className={showProgress ? "" : "opacity-0"}');
  });
});
