import { beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({ getSessionOrThrow: vi.fn() }));
const dataMocks = vi.hoisted(() => ({
  createGearColorwayData: vi.fn(),
  deleteGearColorwayData: vi.fn(),
  enableGearColorwaysData: vi.fn(),
  reorderGearColorwaysData: vi.fn(),
  resetGearColorwaysData: vi.fn(),
  setGearColorwayImageData: vi.fn(),
  updateGearColorwayData: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("~/server/auth", () => authMocks);
vi.mock("~/server/admin/colorways/data", () => dataMocks);

import {
  deleteGearColorwayService,
  enableGearColorwaysService,
  normalizeSwatchColor,
  reorderGearColorwaysService,
  setGearColorwayImageService,
} from "~/server/admin/colorways/service";

describe("colorway admin service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.getSessionOrThrow.mockResolvedValue({
      user: { id: "editor-1", role: "EDITOR" },
    });
  });

  it("normalizes swatches and enables explicit mode through the data layer", async () => {
    dataMocks.enableGearColorwaysData.mockResolvedValue({
      colorway: { id: "cw-1" },
      gearSlug: "nikon-zf",
    });

    await enableGearColorwaysService({
      gearId: "gear-1",
      name: "  Silver  ",
      swatchColorA: "#fafafa",
      swatchColorB: "#737373",
    });

    expect(dataMocks.enableGearColorwaysData).toHaveBeenCalledWith({
      gearId: "gear-1",
      actorUserId: "editor-1",
      input: {
        name: "Silver",
        slug: "silver",
        swatchColorA: "#FAFAFA",
        swatchColorB: "#737373",
      },
    });
  });

  it("rejects malformed colors before writing", () => {
    expect(() => normalizeSwatchColor("white")).toThrow("#RRGGBB");
    expect(dataMocks.enableGearColorwaysData).not.toHaveBeenCalled();
  });

  it("allows editors to reorder but not delete colorways", async () => {
    dataMocks.reorderGearColorwaysData.mockResolvedValue({
      colorways: [],
      gearSlug: "nikon-zf",
    });
    await reorderGearColorwaysService({
      gearId: "gear-1",
      orderedIds: ["cw-2", "cw-1"],
    });
    expect(dataMocks.reorderGearColorwaysData).toHaveBeenCalledWith({
      gearId: "gear-1",
      orderedIds: ["cw-2", "cw-1"],
      actorUserId: "editor-1",
    });

    await expect(
      deleteGearColorwayService({ gearId: "gear-1", colorwayId: "cw-1" }),
    ).rejects.toMatchObject({ status: 403 });
    expect(dataMocks.deleteGearColorwayData).not.toHaveBeenCalled();
  });

  it("requires an admin for image removal while allowing editor uploads", async () => {
    dataMocks.setGearColorwayImageData.mockResolvedValue({
      colorway: { id: "cw-1" },
      gearSlug: "nikon-zf",
    });
    await setGearColorwayImageService({
      gearId: "gear-1",
      colorwayId: "cw-1",
      imageType: "front",
      imageUrl: "https://cdn.example.com/front.webp",
    });
    expect(dataMocks.setGearColorwayImageData).toHaveBeenCalledOnce();

    await expect(
      setGearColorwayImageService({
        gearId: "gear-1",
        colorwayId: "cw-1",
        imageType: "front",
        imageUrl: null,
      }),
    ).rejects.toMatchObject({ status: 403 });
  });
});
