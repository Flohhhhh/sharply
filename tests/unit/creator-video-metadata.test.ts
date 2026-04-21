import { afterEach,beforeEach,describe,expect,it,vi } from "vitest";
import {
  normalizeYouTubeVideoUrl,
  resolveCreatorVideoMetadata,
} from "~/server/creator-videos/metadata";

describe("creator video metadata", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("normalizes standard YouTube watch URLs", () => {
    expect(
      normalizeYouTubeVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    ).toMatchObject({
      normalizedUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      externalVideoId: "dQw4w9WgXcQ",
    });
  });

  it("normalizes YouTube share and shorts URLs", () => {
    expect(normalizeYouTubeVideoUrl("https://youtu.be/dQw4w9WgXcQ")).toMatchObject(
      {
        externalVideoId: "dQw4w9WgXcQ",
      },
    );
    expect(
      normalizeYouTubeVideoUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ"),
    ).toMatchObject({
      externalVideoId: "dQw4w9WgXcQ",
    });
  });

  it("rejects non-video YouTube URLs", () => {
    expect(() =>
      normalizeYouTubeVideoUrl("https://www.youtube.com/@somecreator"),
    ).toThrow("Only individual YouTube video URLs are supported");
  });

  it("returns resolved metadata when oEmbed succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          title: "Sample Video",
          thumbnail_url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
        }),
      }),
    );

    const result = await resolveCreatorVideoMetadata(
      "https://youtu.be/dQw4w9WgXcQ",
    );

    expect(result).toMatchObject({
      metadataStatus: "resolved",
      title: "Sample Video",
      thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    });
  });

  it("falls back to manual mode when oEmbed fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      }),
    );

    const result = await resolveCreatorVideoMetadata(
      "https://youtu.be/dQw4w9WgXcQ",
    );

    expect(result).toMatchObject({
      metadataStatus: "manual_required",
      title: null,
      thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    });
  });
});
