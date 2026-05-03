import { beforeEach,describe,expect,it,vi } from "vitest";

process.env.AUTH_SECRET = "test-auth-secret";

const exifTrackingDataMocks = vi.hoisted(() => ({
  findTrackedCameraPreviewByUserAndSerialHash: vi.fn(),
  hasExifReadingByDedupeKey: vi.fn(),
  upsertTrackedExifCamera: vi.fn(),
  persistTrackedExifReading: vi.fn(),
  syncTrackedCameraCollectionBinding: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("~/server/exif-tracking/data", () => exifTrackingDataMocks);

import {
  createSignedExifTrackingToken,
  saveExifTrackingCandidate,
} from "~/server/exif-tracking/service";

describe("EXIF collection binding save flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AUTH_SECRET = "test-auth-secret";
  });

  it("syncs collection binding after saving a matched EXIF reading", async () => {
    exifTrackingDataMocks.findTrackedCameraPreviewByUserAndSerialHash.mockResolvedValue(
      null,
    );
    exifTrackingDataMocks.upsertTrackedExifCamera.mockResolvedValue({
      trackedCamera: {
        id: "tracked-1",
        readingCount: 1,
        latestPrimaryCountValue: 1200,
        latestCaptureAt: "2026-05-03T10:00:00.000Z",
      },
      matchedGear: {
        id: "gear-1",
        slug: "camera-slug",
        name: "Camera",
      },
    });
    exifTrackingDataMocks.persistTrackedExifReading.mockResolvedValue({
      trackedCamera: {
        id: "tracked-1",
        readingCount: 1,
        latestPrimaryCountValue: 1200,
        latestCaptureAt: "2026-05-03T10:00:00.000Z",
      },
      matchedGear: {
        id: "gear-1",
        slug: "camera-slug",
        name: "Camera",
      },
    });

    const token = await createSignedExifTrackingToken({
      version: 1,
      serialHash: "serial-hash",
      normalizedBrand: "sony",
      makeRaw: "Sony",
      modelRaw: "A7 IV",
      matchedGearId: "gear-1",
      captureAt: "2026-05-03T10:00:00.000Z",
      primaryCountType: "total",
      primaryCountValue: 1200,
      shutterCount: 1200,
      totalShutterCount: 1200,
      mechanicalShutterCount: null,
      sourceTag: "Sony:ShutterCount",
      mechanicalSourceTag: null,
    });

    await expect(
      saveExifTrackingCandidate({
        userId: "user-1",
        token,
      }),
    ).resolves.toMatchObject({
      ok: true,
    });

    expect(
      exifTrackingDataMocks.syncTrackedCameraCollectionBinding,
    ).toHaveBeenCalledWith({
      trackedCameraId: "tracked-1",
      userId: "user-1",
      gearId: "gear-1",
    });
  });

  it("clears collection binding when the matched gear is absent", async () => {
    exifTrackingDataMocks.findTrackedCameraPreviewByUserAndSerialHash.mockResolvedValue(
      null,
    );
    exifTrackingDataMocks.upsertTrackedExifCamera.mockResolvedValue({
      trackedCamera: {
        id: "tracked-2",
        readingCount: 1,
        latestPrimaryCountValue: 800,
        latestCaptureAt: "2026-05-03T10:00:00.000Z",
      },
      matchedGear: null,
    });
    exifTrackingDataMocks.persistTrackedExifReading.mockResolvedValue({
      trackedCamera: {
        id: "tracked-2",
        readingCount: 1,
        latestPrimaryCountValue: 800,
        latestCaptureAt: "2026-05-03T10:00:00.000Z",
      },
      matchedGear: null,
    });

    const token = await createSignedExifTrackingToken({
      version: 1,
      serialHash: "serial-hash-2",
      normalizedBrand: "sony",
      makeRaw: "Sony",
      modelRaw: "Unknown",
      matchedGearId: null,
      captureAt: "2026-05-03T10:00:00.000Z",
      primaryCountType: "total",
      primaryCountValue: 800,
      shutterCount: 800,
      totalShutterCount: 800,
      mechanicalShutterCount: null,
      sourceTag: "Sony:ShutterCount",
      mechanicalSourceTag: null,
    });

    await saveExifTrackingCandidate({
      userId: "user-1",
      token,
    });

    expect(
      exifTrackingDataMocks.syncTrackedCameraCollectionBinding,
    ).toHaveBeenCalledWith({
      trackedCameraId: "tracked-2",
      userId: "user-1",
      gearId: null,
    });
  });
});
