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
  setGearRearViewService: vi.fn(),
  setGearThumbnailService: vi.fn(),
  setGearTopViewService: vi.fn(),
  updateGearAliasesService: vi.fn(),
}));

vi.mock("next/cache", () => cacheMocks);
vi.mock("server-only", () => ({}));
vi.mock("~/server/admin/gear/service", () => serviceMocks);

import {
  actionClearGearRearView,
  actionSetGearRearView,
} from "~/server/admin/gear/actions";

describe("rear view gear admin actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("revalidates dependent routes after setting a rear view", async () => {
    serviceMocks.setGearRearViewService.mockResolvedValue({
      id: "gear-1",
      slug: "nikon-zf",
      rearViewUrl: "https://cdn.example.com/rear.webp",
    });

    const result = await actionSetGearRearView({
      gearId: "gear-1",
      rearViewUrl: "https://cdn.example.com/rear.webp",
    });

    expect(result).toMatchObject({
      slug: "nikon-zf",
      rearViewUrl: "https://cdn.example.com/rear.webp",
    });
    expect(cacheMocks.revalidatePath).toHaveBeenCalledWith("/admin/gear");
    expect(cacheMocks.revalidatePath).toHaveBeenCalledWith("/gear/nikon-zf");
    expect(cacheMocks.revalidatePath).toHaveBeenCalledWith("/browse");
  });

  it("revalidates dependent routes after clearing a rear view", async () => {
    serviceMocks.clearGearRearViewService.mockResolvedValue({
      id: "gear-1",
      slug: "nikon-zf",
      rearViewUrl: null,
    });

    const result = await actionClearGearRearView({
      gearId: "gear-1",
    });

    expect(result).toMatchObject({
      slug: "nikon-zf",
      rearViewUrl: null,
    });
    expect(cacheMocks.revalidatePath).toHaveBeenCalledWith("/admin/gear");
    expect(cacheMocks.revalidatePath).toHaveBeenCalledWith("/gear/nikon-zf");
    expect(cacheMocks.revalidatePath).toHaveBeenCalledWith("/browse");
  });
});
