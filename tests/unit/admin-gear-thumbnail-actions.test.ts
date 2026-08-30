import { beforeEach, describe, expect, it, vi } from "vitest";

const cacheMocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
}));

const revalidationMocks = vi.hoisted(() => ({
  revalidateGearPages: vi.fn(),
}));

const serviceMocks = vi.hoisted(() => ({
  clearGearLeftViewService: vi.fn(),
  clearGearRearViewService: vi.fn(),
  clearGearRightViewService: vi.fn(),
  clearGearThumbnailService: vi.fn(),
  clearGearTopViewService: vi.fn(),
  createGearAdmin: vi.fn(),
  deleteGearService: vi.fn(),
  renameGearService: vi.fn(),
  setGearLeftViewService: vi.fn(),
  setGearOgImageService: vi.fn(),
  setGearRearViewService: vi.fn(),
  setGearRightViewService: vi.fn(),
  setGearThumbnailService: vi.fn(),
  setGearTopViewService: vi.fn(),
  updateGearAliasesService: vi.fn(),
}));

vi.mock("next/cache", () => cacheMocks);
vi.mock("server-only", () => ({}));
vi.mock("~/server/admin/gear/service", () => serviceMocks);
vi.mock("~/server/revalidation", () => revalidationMocks);

import {
  actionRenameGear,
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
    expect(revalidationMocks.revalidateGearPages).toHaveBeenCalledWith(
      ["nikon-z6iii"],
      { includeBrowse: true },
    );
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
    expect(revalidationMocks.revalidateGearPages).toHaveBeenCalledWith([
      "nikon-z6iii",
    ]);
  });

  it("revalidates both old and new gear paths after a rename", async () => {
    serviceMocks.renameGearService.mockResolvedValue({
      id: "gear-1",
      name: "Nikon Z6 IV",
      previousSlug: "nikon-z6iii",
      slug: "nikon-z6-iv",
      searchName: "nikon z6 iv",
    });

    const result = await actionRenameGear({
      gearId: "gear-1",
      newName: "Z6 IV",
    });

    expect(result).toMatchObject({
      previousSlug: "nikon-z6iii",
      slug: "nikon-z6-iv",
    });
    expect(revalidationMocks.revalidateGearPages).toHaveBeenCalledWith(
      ["nikon-z6iii", "nikon-z6-iv"],
      { includeBrowse: true },
    );
  });

  it("returns a serializable review rejection without revalidating", async () => {
    serviceMocks.setGearThumbnailService.mockRejectedValue(
      Object.assign(new Error("GEAR_IMAGE_REVIEW_REJECTED:IMAGE_TOO_SMALL"), {
        code: "GEAR_IMAGE_REVIEW_REJECTED",
      }),
    );

    await expect(
      actionSetGearThumbnail({
        gearId: "gear-1",
        thumbnailUrl: "https://utfs.io/f/front.jpg",
      }),
    ).resolves.toEqual({
      review: { status: "rejected", reason: "IMAGE_TOO_SMALL" },
    });
    expect(cacheMocks.revalidatePath).not.toHaveBeenCalled();
  });
});
