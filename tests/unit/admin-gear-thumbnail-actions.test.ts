import { beforeEach,describe,expect,it,vi } from "vitest";

const cacheMocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
}));

const serviceMocks = vi.hoisted(() => ({
  clearGearRearViewService: vi.fn(),
  clearGearThumbnailService: vi.fn(),
  clearGearTopViewService: vi.fn(),
  createGearAdmin: vi.fn(),
  deleteGearService: vi.fn(),
  renameGearService: vi.fn(),
  setGearOgImageService: vi.fn(),
  setGearRearViewService: vi.fn(),
  setGearThumbnailService: vi.fn(),
  setGearTopViewService: vi.fn(),
  updateGearAliasesService: vi.fn(),
}));

vi.mock("next/cache", () => cacheMocks);
vi.mock("server-only", () => ({}));
vi.mock("~/server/admin/gear/service", () => serviceMocks);

import {
  actionSetGearOgImage,
  actionSetGearThumbnail,
} from "~/server/admin/gear/actions";

describe("thumbnail gear admin actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("revalidates gear routes after storing a thumbnail and OG image pair", async () => {
    serviceMocks.setGearThumbnailService.mockResolvedValue({
      id: "gear-1",
      slug: "nikon-z6iii",
      thumbnailUrl: "https://cdn.example.com/front.jpg",
      ogImageUrl: "https://cdn.example.com/front-og.jpg",
    });

    const result = await actionSetGearThumbnail({
      gearId: "gear-1",
      thumbnailUrl: "https://cdn.example.com/front.jpg",
      ogImageUrl: "https://cdn.example.com/front-og.jpg",
    });

    expect(result).toMatchObject({
      slug: "nikon-z6iii",
      ogImageUrl: "https://cdn.example.com/front-og.jpg",
    });
    expect(cacheMocks.revalidatePath).toHaveBeenCalledWith("/admin/gear");
    expect(cacheMocks.revalidatePath).toHaveBeenCalledWith("/gear/nikon-z6iii");
    expect(cacheMocks.revalidatePath).toHaveBeenCalledWith("/browse");
  });

  it("revalidates the gear page after storing a generated OG asset", async () => {
    serviceMocks.setGearOgImageService.mockResolvedValue({
      id: "gear-1",
      slug: "nikon-z6iii",
      ogImageUrl: "https://cdn.example.com/front-og.jpg",
    });

    const result = await actionSetGearOgImage({
      gearId: "gear-1",
      ogImageUrl: "https://cdn.example.com/front-og.jpg",
    });

    expect(result).toMatchObject({
      slug: "nikon-z6iii",
      ogImageUrl: "https://cdn.example.com/front-og.jpg",
    });
    expect(cacheMocks.revalidatePath).toHaveBeenCalledWith("/admin/gear");
    expect(cacheMocks.revalidatePath).toHaveBeenCalledWith("/gear/nikon-z6iii");
  });
});
