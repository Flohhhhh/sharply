import { beforeEach,describe,expect,it,vi } from "vitest";

const authHelperMocks = vi.hoisted(() => ({
  getSessionOrThrow: vi.fn(),
}));

const gearDataMocks = vi.hoisted(() => ({
  addOwnership: vi.fn(),
  removeOwnership: vi.fn(),
}));

const analyticsMocks = vi.hoisted(() => ({
  track: vi.fn(),
}));

const badgeMocks = vi.hoisted(() => ({
  evaluateForEvent: vi.fn(),
}));

const exifTrackingDataMocks = vi.hoisted(() => ({
  bindTrackedCamerasToOwnedGear: vi.fn(),
  unbindTrackedCamerasFromOwnedGear: vi.fn(),
  findTrackedCameraPreviewByUserAndSerialHash: vi.fn(),
  hasExifReadingByDedupeKey: vi.fn(),
  upsertTrackedExifCamera: vi.fn(),
  persistTrackedExifReading: vi.fn(),
  syncTrackedCameraCollectionBinding: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("~/server/auth", () => authHelperMocks);
vi.mock("~/server/gear/data", () => gearDataMocks);
vi.mock("~/server/analytics", () => analyticsMocks);
vi.mock("~/server/badges/service", () => badgeMocks);
vi.mock("~/server/exif-tracking/data", () => exifTrackingDataMocks);

import { saveExifTrackingCandidate } from "~/server/exif-tracking/service";
import * as gearService from "~/server/gear/service";

describe("EXIF collection binding integration hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AUTH_SECRET = "test-auth-secret";

    authHelperMocks.getSessionOrThrow.mockResolvedValue({
      user: { id: "user-1" },
    });

    analyticsMocks.track.mockResolvedValue(undefined);
    badgeMocks.evaluateForEvent.mockResolvedValue({ awarded: [] });
  });

  it("binds tracked cameras after ownership is added", async () => {
    vi.spyOn(gearService as typeof gearService, "resolveGearIdOrThrow").mockResolvedValue(
      "gear-1",
    );
    gearDataMocks.addOwnership.mockResolvedValue({
      added: true,
      alreadyExists: false,
    });

    await expect(gearService.toggleOwnership("camera-slug", "add")).resolves.toMatchObject({
      ok: true,
      action: "added",
    });

    expect(exifTrackingDataMocks.bindTrackedCamerasToOwnedGear).toHaveBeenCalledWith({
      userId: "user-1",
      gearId: "gear-1",
    });
  });

  it("unbinds tracked cameras after ownership is removed", async () => {
    vi.spyOn(gearService as typeof gearService, "resolveGearIdOrThrow").mockResolvedValue(
      "gear-1",
    );
    gearDataMocks.removeOwnership.mockResolvedValue({ removed: true });

    await expect(
      gearService.toggleOwnership("camera-slug", "remove"),
    ).resolves.toMatchObject({
      ok: true,
      action: "removed",
    });

    expect(exifTrackingDataMocks.unbindTrackedCamerasFromOwnedGear).toHaveBeenCalledWith({
      userId: "user-1",
      gearId: "gear-1",
    });
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

    const { createSignedExifTrackingToken } = await import(
      "~/server/exif-tracking/service"
    );

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
});
