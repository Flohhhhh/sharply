import { beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  getSessionOrThrow: vi.fn(),
}));

const serviceMocks = vi.hoisted(() => ({
  saveExifTrackingCandidate: vi.fn(),
  fetchTrackedCameraHistory: vi.fn(),
  deleteExifTrackedReading: vi.fn(),
}));

vi.mock("~/server/auth", () => authMocks);
vi.mock("~/server/exif-tracking/service", () => serviceMocks);

import { POST } from "../../src/app/(app)/api/exif-tracking/save/route";
import { GET } from "../../src/app/(app)/api/exif-tracking/cameras/[trackedCameraId]/history/route";
import { DELETE } from "../../src/app/(app)/api/exif-tracking/readings/[readingId]/route";

describe("exif tracking routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.getSessionOrThrow.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
  });

  it("saves tracking for authenticated users", async () => {
    serviceMocks.saveExifTrackingCandidate.mockResolvedValue({
      ok: true,
      message: "Camera history saved.",
      tracking: {
        eligible: true,
        reason: null,
        saveToken: null,
        matchedGear: {
          id: "gear-1",
          slug: "nikon-zf",
          name: "Nikon Zf",
        },
        trackedCamera: {
          id: "camera-1",
          readingCount: 2,
          latestPrimaryCountValue: 12345,
          latestCaptureAt: "2024-10-02T22:45:12.000Z",
        },
        currentReadingSaved: true,
      },
    });

    const response = await POST(
      new Request("http://localhost/api/exif-tracking/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: "signed-token" }),
      }),
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(serviceMocks.saveExifTrackingCandidate).toHaveBeenCalledWith({
      userId: "user-1",
      token: "signed-token",
    });
  });

  it("rejects invalid save payloads", async () => {
    const response = await POST(
      new Request("http://localhost/api/exif-tracking/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: "" }),
      }),
    );

    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.ok).toBe(false);
    expect(payload.message).toBe("Invalid EXIF tracking payload.");
  });

  it("returns tracked camera history for authenticated users", async () => {
    serviceMocks.fetchTrackedCameraHistory.mockResolvedValue({
      ok: true,
      trackedCamera: {
        id: "camera-1",
        title: "Nikon Zf",
        matchedGear: {
          id: "gear-1",
          slug: "nikon-zf",
          name: "Nikon Zf",
        },
        readingCount: 2,
        latestPrimaryCountValue: 12345,
        latestCaptureAt: "2024-10-02T22:45:12.000Z",
        firstSeenAt: "2024-10-01T22:45:12.000Z",
        lastSeenAt: "2024-10-02T22:45:12.000Z",
      },
      readings: [],
    });

    const response = await GET(
      new Request("http://localhost/api/exif-tracking/cameras/camera-1/history"),
      {
        params: Promise.resolve({
          trackedCameraId: "camera-1",
        }),
      },
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(serviceMocks.fetchTrackedCameraHistory).toHaveBeenCalledWith({
      userId: "user-1",
      trackedCameraId: "camera-1",
    });
  });

  it("deletes a saved reading for an authenticated user", async () => {
    serviceMocks.deleteExifTrackedReading.mockResolvedValue({
      ok: true,
      message: "Saved EXIF reading deleted.",
      deletedReadingId: "reading-1",
      trackedCamera: {
        id: "camera-1",
        readingCount: 1,
        latestPrimaryCountValue: 12000,
        latestCaptureAt: "2024-10-01T22:45:12.000Z",
      },
      matchedGear: {
        id: "gear-1",
        slug: "nikon-zf",
        name: "Nikon Zf",
      },
    });

    const response = await DELETE(
      new Request("http://localhost/api/exif-tracking/readings/reading-1", {
        method: "DELETE",
      }),
      {
        params: Promise.resolve({
          readingId: "reading-1",
        }),
      },
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(serviceMocks.deleteExifTrackedReading).toHaveBeenCalledWith({
      userId: "user-1",
      readingId: "reading-1",
    });
  });
});
