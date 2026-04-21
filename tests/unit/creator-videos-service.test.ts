import { beforeEach,describe,expect,it,vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  getSessionOrThrow: vi.fn(),
}));

const gearMocks = vi.hoisted(() => ({
  resolveGearIdOrThrow: vi.fn(),
}));

const creatorMocks = vi.hoisted(() => ({
  fetchApprovedCreatorById: vi.fn(),
  fetchActiveApprovedCreatorsForPlatform: vi.fn(),
}));

const dataMocks = vi.hoisted(() => ({
  fetchPublicGearCreatorVideosByGearIdData: vi.fn(),
  fetchManageGearCreatorVideosByGearIdData: vi.fn(),
  upsertGearCreatorVideoData: vi.fn(),
  updateGearCreatorVideoEditorialData: vi.fn(),
  deactivateGearCreatorVideoData: vi.fn(),
}));

const metadataMocks = vi.hoisted(() => ({
  normalizeYouTubeVideoUrl: vi.fn(),
  resolveCreatorVideoMetadata: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("~/server/auth", () => authMocks);
vi.mock("~/server/gear/service", () => gearMocks);
vi.mock("~/server/admin/approved-creators/service", () => creatorMocks);
vi.mock("~/server/creator-videos/data", () => dataMocks);
vi.mock("~/server/creator-videos/metadata", () => metadataMocks);

import {
  createGearCreatorVideo,
  fetchManageGearCreatorVideos,
  resolveGearCreatorVideoInput,
} from "~/server/creator-videos/service";

describe("creator videos service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.getSessionOrThrow.mockResolvedValue({
      user: { id: "editor-1", role: "EDITOR" },
    });
    gearMocks.resolveGearIdOrThrow.mockResolvedValue("gear-1");
    creatorMocks.fetchApprovedCreatorById.mockResolvedValue({
      id: "creator-1",
      platform: "YOUTUBE",
      isActive: true,
    });
    creatorMocks.fetchActiveApprovedCreatorsForPlatform.mockResolvedValue([]);
    dataMocks.fetchManageGearCreatorVideosByGearIdData.mockResolvedValue([]);
    dataMocks.upsertGearCreatorVideoData.mockResolvedValue({ id: "video-1" });
    metadataMocks.normalizeYouTubeVideoUrl.mockReturnValue({
      platform: "YOUTUBE",
      sourceUrl: "https://youtu.be/dQw4w9WgXcQ",
      normalizedUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      externalVideoId: "dQw4w9WgXcQ",
    });
  });

  it("requires editor role to fetch modal data", async () => {
    authMocks.getSessionOrThrow.mockResolvedValue({
      user: { id: "user-1", role: "USER" },
    });

    await expect(fetchManageGearCreatorVideos("gear-slug")).rejects.toMatchObject({
      message: "Unauthorized",
      status: 401,
    });
  });

  it("returns attached videos and active creators for editors", async () => {
    dataMocks.fetchManageGearCreatorVideosByGearIdData.mockResolvedValue([
      { id: "video-1" },
    ]);
    creatorMocks.fetchActiveApprovedCreatorsForPlatform.mockResolvedValue([
      { id: "creator-1" },
    ]);

    await expect(fetchManageGearCreatorVideos("gear-slug")).resolves.toEqual({
      videos: [{ id: "video-1" }],
      creators: [{ id: "creator-1" }],
    });
  });

  it("requires a manual title when automatic metadata lookup fails", async () => {
    await expect(
      createGearCreatorVideo("gear-slug", {
        creatorId: "creator-1",
        url: "https://youtu.be/dQw4w9WgXcQ",
        title: "",
        resolution: {
          platform: "YOUTUBE",
          sourceUrl: "https://youtu.be/dQw4w9WgXcQ",
          normalizedUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
          externalVideoId: "dQw4w9WgXcQ",
          title: null,
          thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
          publishedAt: null,
          metadataStatus: "manual_required",
          message: "Automatic title lookup failed",
        },
      }),
    ).rejects.toMatchObject({
      message: "Add a video title when automatic metadata lookup fails",
      status: 400,
    });
  });

  it("validates creator/platform match during resolve", async () => {
    creatorMocks.fetchApprovedCreatorById.mockResolvedValue({
      id: "creator-1",
      platform: "YOUTUBE",
      isActive: true,
    });
    metadataMocks.resolveCreatorVideoMetadata.mockResolvedValue({
      platform: "YOUTUBE",
      sourceUrl: "https://youtu.be/dQw4w9WgXcQ",
      normalizedUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      externalVideoId: "dQw4w9WgXcQ",
      title: "Sample Video",
      thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      publishedAt: null,
      metadataStatus: "resolved",
      message: null,
    });

    await expect(
      resolveGearCreatorVideoInput({
        creatorId: "creator-1",
        url: "https://youtu.be/dQw4w9WgXcQ",
      }),
    ).resolves.toMatchObject({
      externalVideoId: "dQw4w9WgXcQ",
      metadataStatus: "resolved",
    });
  });
});
