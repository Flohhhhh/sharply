import { beforeEach,describe,expect,it,vi } from "vitest";

const gearServiceMocks = vi.hoisted(() => ({
  fetchAllGearSlugs: vi.fn(),
}));

const payloadServiceMocks = vi.hoisted(() => ({
  getLearnPages: vi.fn(),
  getNewsPosts: vi.fn(),
  getReviews: vi.fn(),
}));

const generatedMocks = vi.hoisted(() => ({
  BRANDS: [{ id: "canon", slug: "canon" }],
  MOUNTS: [{ brand_id: "canon", short_name: "rf" }],
}));

vi.mock("~/server/gear/service", () => gearServiceMocks);
vi.mock("~/server/payload/service", () => payloadServiceMocks);
vi.mock("~/lib/generated", () => generatedMocks);

import sitemap from "~/app/sitemap";

describe("sitemap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gearServiceMocks.fetchAllGearSlugs.mockResolvedValue([]);
    payloadServiceMocks.getNewsPosts.mockResolvedValue([]);
    payloadServiceMocks.getReviews.mockResolvedValue([]);
    payloadServiceMocks.getLearnPages.mockResolvedValue([]);
  });

  it("includes published learn article routes", async () => {
    payloadServiceMocks.getLearnPages.mockResolvedValue([
      {
        _status: "published",
        slug: "the-exposure-triangle",
      },
    ]);

    const result = await sitemap();
    const learnEntry = result.find(
      (entry) =>
        entry.url ===
        "https://www.sharplyphoto.com/learn/the-exposure-triangle",
    );

    expect(learnEntry).toBeDefined();
    expect(learnEntry).toMatchObject({
      changeFrequency: "monthly",
      priority: 0.5,
      alternates: {
        languages: expect.objectContaining({
          en: "https://www.sharplyphoto.com/learn/the-exposure-triangle",
          ja: "https://www.sharplyphoto.com/ja/learn/the-exposure-triangle",
        }),
      },
    });
  });

  it("skips learn article routes that are missing a slug or are not published", async () => {
    payloadServiceMocks.getLearnPages.mockResolvedValue([
      {
        _status: "draft",
        slug: "draft-article",
      },
      {
        _status: "published",
        slug: "",
      },
      {
        _status: "published",
        slug: null,
      },
    ]);

    const result = await sitemap();
    const learnUrls = result
      .map((entry) => entry.url)
      .filter((url) => url.includes("/learn/") && url !== "https://www.sharplyphoto.com/learn");

    expect(learnUrls).toEqual([]);
  });
});
