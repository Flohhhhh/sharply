import { beforeEach, describe, expect, it, vi } from "vitest";
import { EXIF_VIEWER_MAX_FILE_BYTES } from "../../src/app/(app)/(pages)/(tools)/exif-viewer/types";

const exiftoolMocks = vi.hoisted(() => ({
  readExifToolTags: vi.fn(),
  toExifViewerMetadataRows: vi.fn((tagEntries) =>
    tagEntries.map((entry: any) => ({
      key: entry.key,
      group: entry.group,
      tag: entry.tag,
      value: String(entry.value ?? ""),
    })),
  ),
}));

const authMocks = vi.hoisted(() => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue(null),
    },
  },
}));

const trackingMocks = vi.hoisted(() => ({
  buildTrackingPreviewFromParseResult: vi.fn().mockResolvedValue({
    eligible: true,
    reason: "not_signed_in",
    saveToken: null,
    matchedGear: null,
    trackedCamera: null,
    currentReadingSaved: false,
  }),
}));

vi.mock(
  "../../src/app/(app)/(pages)/(tools)/exif-viewer/parse/exiftool",
  () => exiftoolMocks,
);
vi.mock("~/auth", () => authMocks);
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));
vi.mock("~/server/exif-tracking/service", () => trackingMocks);

import { POST } from "../../src/app/(app)/(pages)/(tools)/exif-viewer/parse/route";

describe("exif viewer parse route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.auth.api.getSession.mockResolvedValue(null);
    trackingMocks.buildTrackingPreviewFromParseResult.mockResolvedValue({
      eligible: true,
      reason: "not_signed_in",
      saveToken: null,
      matchedGear: null,
      trackedCamera: null,
      currentReadingSaved: false,
    });
    exiftoolMocks.readExifToolTags.mockResolvedValue({
      allTags: [
        {
          key: "EXIF:Make",
          group: "EXIF",
          tag: "Make",
          value: "NIKON CORPORATION",
        },
        {
          key: "EXIF:Model",
          group: "EXIF",
          tag: "Model",
          value: "Zf",
        },
        {
          key: "MakerNotes:ShutterCount",
          group: "MakerNotes",
          tag: "ShutterCount",
          value: "3456",
        },
        {
          key: "Nikon:MechanicalShutterCount",
          group: "Nikon",
          tag: "MechanicalShutterCount",
          value: "3000",
        },
        {
          key: "EXIF:ISO",
          group: "EXIF",
          tag: "ISO",
          value: "800",
        },
      ],
      rawTags: {
        "EXIF:Make": "NIKON CORPORATION",
        "EXIF:Model": "Zf",
        "MakerNotes:ShutterCount": "3456",
      },
      relevantTags: [
        {
          key: "EXIF:Make",
          group: "EXIF",
          tag: "Make",
          value: "NIKON CORPORATION",
        },
        {
          key: "EXIF:Model",
          group: "EXIF",
          tag: "Model",
          value: "Zf",
        },
        {
          key: "MakerNotes:ShutterCount",
          group: "MakerNotes",
          tag: "ShutterCount",
          value: "3456",
        },
        {
          key: "Nikon:MechanicalShutterCount",
          group: "Nikon",
          tag: "MechanicalShutterCount",
          value: "3000",
        },
      ],
      warnings: ["minor warning"],
    });
  });

  it("rejects unsupported extensions", async () => {
    const formData = new FormData();
    formData.set("file", new File(["x"], "sample.png", { type: "image/png" }));

    const response = await POST(
      new Request("http://localhost/exif-viewer/parse", {
        method: "POST",
        body: formData,
      }) as any,
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.status).toBe("unsupported_format");
    expect(payload.metadata.rows).toEqual([]);
    expect(payload.tracking).toEqual({
      eligible: false,
      reason: "unsupported_result",
      saveToken: null,
      matchedGear: null,
      trackedCamera: null,
      currentReadingSaved: false,
    });
    expect(exiftoolMocks.readExifToolTags).not.toHaveBeenCalled();
  });

  it("rejects empty files", async () => {
    const formData = new FormData();
    formData.set("file", new File([], "sample.jpg", { type: "image/jpeg" }));

    const response = await POST(
      new Request("http://localhost/exif-viewer/parse", {
        method: "POST",
        body: formData,
      }) as any,
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.status).toBe("parse_error");
    expect(payload.message).toBe("The uploaded file is empty.");
    expect(payload.metadata.rows).toEqual([]);
    expect(payload.tracking.reason).toBe("unsupported_result");
  });

  it("rejects files that exceed the size limit", async () => {
    const oversizedFile = new File(["x"], "sample.jpg", { type: "image/jpeg" });
    Object.defineProperty(oversizedFile, "size", {
      value: EXIF_VIEWER_MAX_FILE_BYTES + 1,
    });

    const formData = new FormData();
    formData.set("file", oversizedFile);

    const response = await POST({
      formData: async () => formData,
    } as any);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.status).toBe("file_too_large");
    expect(exiftoolMocks.readExifToolTags).not.toHaveBeenCalled();
  });

  it("returns structured parse errors from the ExifTool bridge", async () => {
    exiftoolMocks.readExifToolTags.mockRejectedValueOnce(
      new Error("ExifTool blew up"),
    );

    const formData = new FormData();
    formData.set("file", new File(["x"], "sample.jpg", { type: "image/jpeg" }));

    const response = await POST(
      new Request("http://localhost/exif-viewer/parse", {
        method: "POST",
        body: formData,
      }) as any,
    );
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.status).toBe("parse_error");
    expect(payload.message).toBe("ExifTool blew up");
    expect(payload.metadata.rows).toEqual([]);
    expect(payload.tracking.reason).toBe("unsupported_result");
  });

  it("returns the expected success shape", async () => {
    const formData = new FormData();
    formData.set("file", new File(["x"], "sample.dng", { type: "image/x-adobe-dng" }));

    const response = await POST(
      new Request("http://localhost/exif-viewer/parse", {
        method: "POST",
        body: formData,
      }) as any,
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.status).toBe("success");
    expect(payload.file.extension).toBe("dng");
    expect(payload.camera).toEqual({
      make: "NIKON CORPORATION",
      model: "Zf",
      normalizedBrand: "nikon",
    });
    expect(payload.extractor.selected).toBe("nikon");
    expect(payload.extractor.shutterCount).toBe(3456);
    expect(payload.extractor.countType).toBe("total");
    expect(payload.extractor.totalShutterCount).toBe(3456);
    expect(payload.extractor.mechanicalShutterCount).toBe(3000);
    expect(payload.tracking).toEqual({
      eligible: true,
      reason: "not_signed_in",
      saveToken: null,
      matchedGear: null,
      trackedCamera: null,
      currentReadingSaved: false,
    });
    expect(payload.metadata.rows).toEqual([
      {
        key: "EXIF:Make",
        group: "EXIF",
        tag: "Make",
        value: "NIKON CORPORATION",
      },
      {
        key: "EXIF:Model",
        group: "EXIF",
        tag: "Model",
        value: "Zf",
      },
      {
        key: "MakerNotes:ShutterCount",
        group: "MakerNotes",
        tag: "ShutterCount",
        value: "3456",
      },
      {
        key: "Nikon:MechanicalShutterCount",
        group: "Nikon",
        tag: "MechanicalShutterCount",
        value: "3000",
      },
      {
        key: "EXIF:ISO",
        group: "EXIF",
        tag: "ISO",
        value: "800",
      },
    ]);
    expect(payload.debug.tagCount).toBe(3);
    expect(payload.debug.warnings).toEqual(["minor warning"]);
    expect(payload.debug.relevantTags).toHaveLength(4);
    expect(trackingMocks.buildTrackingPreviewFromParseResult).toHaveBeenCalled();
  });
});
