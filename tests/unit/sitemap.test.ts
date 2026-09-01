import { beforeEach, describe, expect, it, vi } from "vitest";

const gearServiceMocks = vi.hoisted(() => ({
  fetchGearSitemapEntries: vi.fn(),
}));

const payloadServiceMocks = vi.hoisted(() => ({
  getLearnPages: vi.fn(),
  getNewsPosts: vi.fn(),
  getReviews: vi.fn(),
}));

const tagsServiceMocks = vi.hoisted(() => ({
  fetchTagSitemapEntries: vi.fn(),
}));

const generatedMocks = vi.hoisted(() => ({
  BRANDS: [{ id: "canon", slug: "canon" }],
  MOUNTS: [{ brand_id: "canon", short_name: "rf" }],
}));

vi.mock("~/server/gear/service", () => gearServiceMocks);
vi.mock("~/server/payload/service", () => payloadServiceMocks);
vi.mock("~/server/tags/service", () => tagsServiceMocks);
vi.mock("~/lib/generated", () => generatedMocks);

import sitemap from "~/app/sitemap";

describe("sitemap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gearServiceMocks.fetchGearSitemapEntries.mockResolvedValue([]);
    tagsServiceMocks.fetchTagSitemapEntries.mockResolvedValue([]);
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
          zh: "https://www.sharplyphoto.com/zh/learn/the-exposure-triangle",
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
    const staticLearnUrls = [
      "https://www.sharplyphoto.com/learn",
      "https://www.sharplyphoto.com/learn/basics",
    ];
    const learnUrls = result
      .map((entry) => entry.url)
      .filter(
        (url) => url.includes("/learn") && !staticLearnUrls.includes(url),
      );

    expect(learnUrls).toEqual([]);
  });

  it("uses real content timestamps for lastModified and omits it on static routes", async () => {
    const updatedAt = new Date("2026-05-01T12:00:00.000Z");
    gearServiceMocks.fetchGearSitemapEntries.mockResolvedValue([
      { slug: "nikon-z8", updatedAt },
    ]);

    const result = await sitemap();
    const gearEntry = result.find(
      (entry) => entry.url === "https://www.sharplyphoto.com/gear/nikon-z8",
    );
    const homeEntry = result.find(
      (entry) => entry.url === "https://www.sharplyphoto.com/",
    );

    expect(gearEntry?.lastModified).toEqual(updatedAt);
    expect(homeEntry).toBeDefined();
    expect(homeEntry?.lastModified).toBeUndefined();
  });

  it("includes listed tag pages and excludes the redirecting /gear url", async () => {
    tagsServiceMocks.fetchTagSitemapEntries.mockResolvedValue([
      { slug: "budget-primes", updatedAt: new Date("2026-04-01T00:00:00Z") },
    ]);

    const result = await sitemap();
    const urls = result.map((entry) => entry.url);

    expect(urls).toContain("https://www.sharplyphoto.com/tags/budget-primes");
    expect(urls).not.toContain("https://www.sharplyphoto.com/gear");
  });
});
