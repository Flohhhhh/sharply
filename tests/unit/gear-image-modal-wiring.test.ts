import fs from "node:fs";
import path from "node:path";
import { describe,expect,it } from "vitest";

const projectRoot = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

describe("GearImageModal rear view wiring", () => {
  it("threads a third rear-view slot through the modal actions and props", () => {
    const source = read("src/components/modals/gear-image-modal.tsx");

    expect(source).toContain("currentRearViewUrl?: string;");
    expect(source).toContain('type ImageType = "thumbnail" | "topView" | "rearView"');
    expect(source).toContain("actionSetGearRearView");
    expect(source).toContain("actionClearGearRearView");
    expect(source).toContain('imageType="rearView"');
    expect(source).toContain('title={t("rearView")}');
  });
});
