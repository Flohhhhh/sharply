import { beforeEach,describe,expect,it,vi } from "vitest";

const serviceMocks = vi.hoisted(() => ({
  fetchManageGearCreatorVideos: vi.fn(),
  resolveGearCreatorVideoInput: vi.fn(),
}));

vi.mock("~/server/creator-videos/service", () => serviceMocks);

import { GET as getManageData } from "../../src/app/api/gear/[slug]/creator-videos/manage-data/route";
import { POST as postResolve } from "../../src/app/api/gear/creator-videos/resolve/route";

describe("creator video routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns manage data for authorized requests", async () => {
    serviceMocks.fetchManageGearCreatorVideos.mockResolvedValue({
      videos: [{ id: "video-1" }],
      creators: [{ id: "creator-1" }],
    });

    const response = await getManageData(new Request("http://localhost") as any, {
      params: Promise.resolve({ slug: "nikon-zf" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      videos: [{ id: "video-1" }],
      creators: [{ id: "creator-1" }],
    });
  });

  it("returns service errors from manage data route", async () => {
    serviceMocks.fetchManageGearCreatorVideos.mockRejectedValue(
      Object.assign(new Error("Unauthorized"), { status: 401 }),
    );

    const response = await getManageData(new Request("http://localhost") as any, {
      params: Promise.resolve({ slug: "nikon-zf" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toEqual({ error: "Unauthorized" });
  });

  it("validates and resolves video metadata", async () => {
    serviceMocks.resolveGearCreatorVideoInput.mockResolvedValue({
      externalVideoId: "dQw4w9WgXcQ",
      metadataStatus: "resolved",
    });

    const response = await postResolve(
      new Request("http://localhost/api/gear/creator-videos/resolve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          creatorId: "creator-1",
          url: "https://youtu.be/dQw4w9WgXcQ",
        }),
      }) as any,
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      resolution: {
        externalVideoId: "dQw4w9WgXcQ",
        metadataStatus: "resolved",
      },
    });
  });

  it("returns validation errors for malformed resolve payloads", async () => {
    const response = await postResolve(
      new Request("http://localhost/api/gear/creator-videos/resolve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          creatorId: "",
          url: "",
        }),
      }) as any,
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBeTruthy();
    expect(serviceMocks.resolveGearCreatorVideoInput).not.toHaveBeenCalled();
  });
});
