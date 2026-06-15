import { beforeEach,describe,expect,it,vi } from "vitest";

const intlMocks = vi.hoisted(() => ({
  getTranslations: vi.fn(),
}));

const gearServiceMocks = vi.hoisted(() => ({
  fetchGearBySlug: vi.fn(),
  fetchStaffVerdict: vi.fn(),
}));

const namingMocks = vi.hoisted(() => ({
  GetGearDisplayName: vi.fn(() => "Nikon Z6III"),
}));

const regionMocks = vi.hoisted(() => ({
  resolveRegionFromCountryCode: vi.fn(() => "GLOBAL"),
}));

const descriptionMocks = vi.hoisted(() => ({
  buildGearMetaDescription: vi.fn(() => "A camera description"),
}));

vi.mock("next-intl/server", () => intlMocks);
vi.mock("~/server/gear/service", () => gearServiceMocks);
vi.mock("~/lib/gear/naming", () => namingMocks);
vi.mock("~/lib/gear/region", () => regionMocks);
vi.mock("~/lib/seo/build-gear-meta-description", () => descriptionMocks);

import { generateGearPageMetadata } from "~/app/[locale]/(pages)/gear/[slug]/metadata";

describe("gear page metadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_BASE_URL = "https://www.sharplyphoto.com";
    intlMocks.getTranslations.mockResolvedValue((key: string) => {
      if (key === "metaTitleSuffix") return "Specs & Reviews | Sharply";
      if (key === "itemNotFoundTitle") return "Not found";
      if (key === "itemNotFoundDescription") return "Missing gear";
      return key;
    });
    gearServiceMocks.fetchStaffVerdict.mockResolvedValue(null);
  });

  it("prefers the stored OG image URL when present", async () => {
    gearServiceMocks.fetchGearBySlug.mockResolvedValue({
      name: "Nikon Z6III",
      regionalAliases: [],
      thumbnailUrl: "https://cdn.example.com/thumb.jpg",
      ogImageUrl: "https://cdn.example.com/og.jpg",
    });

    const metadata = await generateGearPageMetadata({
      locale: "en",
      slug: "nikon-z6iii",
    });

    expect(metadata.openGraph?.images).toEqual([
      { url: "https://cdn.example.com/og.jpg" },
    ]);
    expect(metadata.twitter?.images).toEqual([
      { url: "https://cdn.example.com/og.jpg" },
    ]);
  });

  it("falls back to the raw thumbnail when no stored OG image exists", async () => {
    gearServiceMocks.fetchGearBySlug.mockResolvedValue({
      name: "Nikon Z6III",
      regionalAliases: [],
      thumbnailUrl: "https://cdn.example.com/thumb.jpg",
      ogImageUrl: null,
    });

    const metadata = await generateGearPageMetadata({
      locale: "en",
      slug: "nikon-z6iii",
    });

    expect(metadata.openGraph?.images).toEqual([
      { url: "https://cdn.example.com/thumb.jpg" },
    ]);
    expect(metadata.twitter?.images).toEqual([
      { url: "https://cdn.example.com/thumb.jpg" },
    ]);
  });

  it("returns empty image arrays when no image is available", async () => {
    gearServiceMocks.fetchGearBySlug.mockResolvedValue({
      name: "Nikon Z6III",
      regionalAliases: [],
      thumbnailUrl: null,
      ogImageUrl: null,
    });

    const metadata = await generateGearPageMetadata({
      locale: "en",
      slug: "nikon-z6iii",
    });

    expect(metadata.openGraph?.images).toEqual([]);
    expect(metadata.twitter?.images).toEqual([]);
  });
});
