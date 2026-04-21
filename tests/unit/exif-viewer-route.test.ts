import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  EXIF_VIEWER_MAX_FILE_BYTES,
  EXIF_VIEWER_MAX_JSON_BODY_BYTES,
  type ExifViewerParseRequest,
} from "../../src/app/[locale]/(pages)/(tools)/exif-viewer/types";

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

vi.mock("~/auth", () => authMocks);
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));
vi.mock("~/server/exif-tracking/service", () => trackingMocks);

import { POST } from "../../src/app/[locale]/(pages)/(tools)/exif-viewer/parse/route";

function createRequestBody(
  overrides: Partial<ExifViewerParseRequest> = {},
): ExifViewerParseRequest {
  return {
    file: {
      name: "sample.nef",
      size: 1024,
      ...overrides.file,
    },
    exiftool: {
      parser: "exiftool-wasm",
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
        {
          key: "XMP:Creator",
          group: "XMP",
          tag: "Creator",
          value: "Camera Owner",
        },
      ],
      warnings: ["minor warning"],
      ...overrides.exiftool,
    },
  };
}

function createJsonRequest(body: unknown) {
  return new Request("http://localhost/exif-viewer/parse", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

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
  });

  it("rejects unsupported extensions derived from file name", async () => {
    const response = await POST(
      createJsonRequest(
        createRequestBody({
          file: {
            name: "sample.png",
            size: 1024,
          },
        }),
      ) as any,
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
  });

  it("rejects zero-size file envelopes", async () => {
    const response = await POST(
      createJsonRequest(
        createRequestBody({
          file: {
            name: "sample.jpg",
            size: 0,
          },
        }),
      ) as any,
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.status).toBe("parse_error");
    expect(payload.message).toBe("The selected file is empty.");
    expect(payload.metadata.rows).toEqual([]);
    expect(payload.tracking.reason).toBe("unsupported_result");
  });

  it("rejects claimed file sizes above the limit", async () => {
    const response = await POST(
      createJsonRequest(
        createRequestBody({
          file: {
            name: "sample.jpg",
            size: EXIF_VIEWER_MAX_FILE_BYTES + 1,
          },
        }),
      ) as any,
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.status).toBe("file_too_large");
    expect(payload.message).toContain("100MB");
  });

  it("rejects empty request bodies before JSON parsing", async () => {
    const response = await POST(
      new Request("http://localhost/exif-viewer/parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: "",
      }) as any,
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.status).toBe("parse_error");
    expect(payload.message).toBe("Missing EXIF metadata payload.");
    expect(payload.metadata.rows).toEqual([]);
  });

  it("rejects oversized JSON request bodies before parsing", async () => {
    const response = await POST(
      new Request("http://localhost/exif-viewer/parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: "x".repeat(EXIF_VIEWER_MAX_JSON_BODY_BYTES + 1),
      }) as any,
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.status).toBe("parse_error");
    expect(payload.message).toBe("Metadata payload is too large.");
    expect(payload.metadata.rows).toEqual([]);
  });

  it("rejects malformed metadata payloads", async () => {
    const response = await POST(
      createJsonRequest({
        file: {
          name: "sample.nef",
          size: 1024,
        },
        exiftool: {
          parser: "exiftool-wasm",
          allTags: [
            {
              key: "",
              group: "EXIF",
              tag: "Make",
              value: "Nikon",
            },
          ],
          warnings: [],
        },
      }) as any,
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.status).toBe("parse_error");
    expect(payload.message).toBe("Invalid EXIF metadata payload.");
  });

  it("rejects unsupported parser ids", async () => {
    const response = await POST(
      createJsonRequest({
        file: {
          name: "sample.nef",
          size: 1024,
        },
        exiftool: {
          parser: "something-else",
          allTags: [],
          warnings: [],
        },
      }) as any,
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.status).toBe("parse_error");
    expect(payload.message).toBe("Invalid EXIF metadata payload.");
  });

  it("returns the expected success shape from client-sent tags", async () => {
    const response = await POST(createJsonRequest(createRequestBody()) as any);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.status).toBe("success");
    expect(payload.file.extension).toBe("nef");
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
      {
        key: "XMP:Creator",
        group: "XMP",
        tag: "Creator",
        value: "Camera Owner",
      },
    ]);
    expect(payload.debug).toMatchObject({
      parser: "exiftool-wasm",
      tagCount: 6,
      warnings: ["minor warning"],
    });
    expect(payload.debug.relevantTags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "MakerNotes:ShutterCount",
          value: "3456",
        }),
      ]),
    );
    expect(
      trackingMocks.buildTrackingPreviewFromParseResult,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        metadataRows: payload.metadata.rows,
        userId: null,
      }),
    );
  });

  it("returns metadata rows from the full sanitized tag list, not only relevant tags", async () => {
    const response = await POST(createJsonRequest(createRequestBody()) as any);
    const payload = await response.json();

    expect(payload.metadata.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "XMP:Creator",
          value: "Camera Owner",
        }),
      ]),
    );
    expect(payload.debug.relevantTags).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "XMP:Creator",
        }),
      ]),
    );
  });

  it("accepts Panasonic rw2 files and surfaces Panasonic metadata groups", async () => {
    const response = await POST(
      createJsonRequest(
        createRequestBody({
          file: {
            name: "sample.rw2",
            size: 1024,
          },
          exiftool: {
            parser: "exiftool-wasm",
            allTags: [
              {
                key: "EXIF:Make",
                group: "EXIF",
                tag: "Make",
                value: "Panasonic",
              },
              {
                key: "EXIF:Model",
                group: "EXIF",
                tag: "Model",
                value: "DC-S5M2",
              },
              {
                key: "Panasonic:InternalSerialNumber",
                group: "Panasonic",
                tag: "InternalSerialNumber",
                value: "P123456789",
              },
              {
                key: "PanasonicRaw:ISO",
                group: "PanasonicRaw",
                tag: "ISO",
                value: 200,
              },
            ],
            warnings: [],
          },
        }),
      ) as any,
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.file.extension).toBe("rw2");
    expect(payload.camera).toEqual({
      make: "Panasonic",
      model: "DC-S5M2",
      normalizedBrand: "panasonic",
    });
    expect(payload.status).toBe("not_found");
    expect(payload.debug.relevantTags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "Panasonic:InternalSerialNumber",
          value: "P123456789",
        }),
        expect.objectContaining({
          key: "PanasonicRaw:ISO",
          value: 200,
        }),
      ]),
    );
  });
});
