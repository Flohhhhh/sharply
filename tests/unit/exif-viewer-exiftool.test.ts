import { beforeEach, describe, expect, it, vi } from "vitest";

const fsMocks = vi.hoisted(() => ({
  unlink: vi.fn(),
  writeFile: vi.fn(),
}));

const exiftoolMocks = vi.hoisted(() => ({
  exiftool: {
    readRaw: vi.fn(),
  },
}));

vi.mock("node:fs/promises", () => fsMocks);
vi.mock("exiftool-vendored", () => exiftoolMocks);

import { readExifToolTags } from "../../src/app/(app)/(pages)/(tools)/exif-viewer/parse/exiftool";

describe("exif viewer exiftool bridge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fsMocks.writeFile.mockResolvedValue(undefined);
    fsMocks.unlink.mockResolvedValue(undefined);
  });

  it("returns group-prefixed tags and cleans up temp files on success", async () => {
    exiftoolMocks.exiftool.readRaw.mockResolvedValue({
      "EXIF:Make": "SONY",
      "EXIF:Model": "ILCE-7M4",
      "Sony:ShutterCount": "5432",
      warnings: ["minor warning"],
    });

    const result = await readExifToolTags({
      fileName: "sample.arw",
      buffer: new Uint8Array([1, 2, 3]),
    });

    expect(fsMocks.writeFile).toHaveBeenCalledTimes(1);
    expect(exiftoolMocks.exiftool.readRaw).toHaveBeenCalledWith(
      expect.stringMatching(/exif-viewer-.*\.arw$/),
      {
        readArgs: ["-G1", "-a", "-s", "-u", "-sort"],
      },
    );
    expect(fsMocks.unlink).toHaveBeenCalledTimes(1);
    expect(result.warnings).toEqual(["minor warning"]);
    expect(result.relevantTags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "Sony:ShutterCount",
          group: "Sony",
          tag: "ShutterCount",
          value: "5432",
        }),
      ]),
    );
  });

  it("cleans up temp files when exiftool fails", async () => {
    exiftoolMocks.exiftool.readRaw.mockRejectedValue(new Error("read failed"));

    await expect(
      readExifToolTags({
        fileName: "sample.cr3",
        buffer: new Uint8Array([9, 8, 7]),
      }),
    ).rejects.toThrow("read failed");

    expect(fsMocks.writeFile).toHaveBeenCalledTimes(1);
    expect(fsMocks.unlink).toHaveBeenCalledTimes(1);
  });
});
