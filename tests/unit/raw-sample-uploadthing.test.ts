import fs from "node:fs";
import path from "node:path";
import { describe,expect,it } from "vitest";
import { extractUploadThingFileKey } from "../../src/server/raw-samples/uploadthing";

const projectRoot = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

describe("extractUploadThingFileKey", () => {
  it("extracts file keys from /f/ UploadThing URLs", () => {
    expect(
      extractUploadThingFileKey(
        "https://utfs.io/f/2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg",
      ),
    ).toBe("2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg");
  });

  it("extracts file keys from app-scoped UploadThing URLs", () => {
    expect(
      extractUploadThingFileKey(
        "https://ufs.sh/a/app_123/2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg?token=abc",
      ),
    ).toBe("2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg");
  });

  it("returns null for invalid or unsupported URLs", () => {
    expect(extractUploadThingFileKey("not-a-url")).toBeNull();
    expect(extractUploadThingFileKey("https://example.com/files/photo.jpg")).toBeNull();
    expect(extractUploadThingFileKey("https://utfs.io/f")).toBeNull();
  });
});

describe("raw sample upload configuration", () => {
  it("allows raw sample uploads up to 256MB", () => {
    const source = read("src/app/api/uploadthing/core.ts");

    expect(source).toContain('rawSampleUploader: f({');
    expect(source).toContain('maxFileSize: "256MB"');
  });
});
