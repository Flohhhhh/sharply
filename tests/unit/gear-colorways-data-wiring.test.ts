import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();
const read = (file: string) =>
  fs.readFileSync(path.join(projectRoot, file), "utf8");

describe("colorway transactional data wiring", () => {
  it("clones base images when explicit mode is enabled", () => {
    const source = read("src/server/admin/colorways/data.ts");
    expect(source).toContain("frontImageUrl: gearRow.thumbnailUrl");
    expect(source).toContain("topViewUrl: gearRow.topViewUrl");
    expect(source).toContain("rearViewUrl: gearRow.rearViewUrl");
  });

  it("mirrors reordered defaults and protects the final row", () => {
    const source = read("src/server/admin/colorways/data.ts");
    expect(source).toContain(
      "await mirrorDefaultColorway(tx, params.gearId, newDefault)",
    );
    expect(source).toContain(
      "Reset color variations to remove the final colorway",
    );
    expect(source).toContain('action: "GEAR_COLORWAY_REORDER"');
  });

  it("distinguishes colorway image contributions from base image edits", () => {
    const source = read("src/server/admin/colorways/data.ts");
    expect(source).toContain("colorwayImageUpload");
    expect(source).toContain("colorwayId: before.id");
    expect(source).toContain('"GEAR_COLORWAY_IMAGE_REMOVE"');
  });
});
