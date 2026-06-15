import { beforeEach,describe,expect,it,vi } from "vitest";

const imageResponseMocks = vi.hoisted(() => {
  const ImageResponse = vi.fn(function ImageResponse(
    this: { element: unknown; init: unknown },
    element: unknown,
    init: unknown,
  ) {
    this.element = element;
    this.init = init;
  });

  return { ImageResponse };
});

const gearServiceMocks = vi.hoisted(() => ({
  fetchGearBySlug: vi.fn(),
}));

const gearNamingMocks = vi.hoisted(() => ({
  GetGearDisplayName: vi.fn(() => "Leica SOFORT 2"),
}));

const gearRegionMocks = vi.hoisted(() => ({
  resolveRegionFromCountryCode: vi.fn(() => "GLOBAL"),
}));

vi.mock("next/og", () => imageResponseMocks);
vi.mock("~/server/gear/service", () => gearServiceMocks);
vi.mock("~/lib/gear/naming", () => gearNamingMocks);
vi.mock("~/lib/gear/region", () => gearRegionMocks);

import GearOgImage, {
  contentType,
  size,
} from "~/app/[locale]/(pages)/gear/[slug]/opengraph-image";

describe("gear opengraph image route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gearServiceMocks.fetchGearBySlug.mockResolvedValue({
      name: "Leica SOFORT 2",
      regionalAliases: [],
      thumbnailUrl: "https://cdn.example.com/leica-sofort-2.png",
    });
  });

  it("renders a PNG response for gear with a thumbnail", async () => {
    await GearOgImage({
      params: Promise.resolve({ locale: "en", slug: "leica-sofort-2" }),
    });

    expect(gearServiceMocks.fetchGearBySlug).toHaveBeenCalledWith(
      "leica-sofort-2",
    );
    expect(imageResponseMocks.ImageResponse).toHaveBeenCalledTimes(1);
    expect(contentType).toBe("image/png");
    expect(size).toEqual({ width: 1200, height: 630 });
  });

  it("returns a fallback image when the gear is missing", async () => {
    gearServiceMocks.fetchGearBySlug.mockResolvedValue(null);

    await GearOgImage({
      params: Promise.resolve({ locale: "en", slug: "missing-gear" }),
    });

    expect(imageResponseMocks.ImageResponse).toHaveBeenCalledTimes(1);
  });

  it("returns a fallback image when the gear has no thumbnail", async () => {
    gearServiceMocks.fetchGearBySlug.mockResolvedValue({
      name: "Leica SOFORT 2",
      regionalAliases: [],
      thumbnailUrl: null,
    });

    await GearOgImage({
      params: Promise.resolve({ locale: "en", slug: "leica-sofort-2" }),
    });

    expect(imageResponseMocks.ImageResponse).toHaveBeenCalledTimes(1);
  });
});
