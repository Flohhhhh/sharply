import { beforeEach,describe,expect,it,vi } from "vitest";

const cacheMocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
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
  setGearRearViewService: vi.fn(),
  setGearRightViewService: vi.fn(),
  setGearThumbnailService: vi.fn(),
  setGearTopViewService: vi.fn(),
  updateGearAliasesService: vi.fn(),
}));

vi.mock("next/cache", () => cacheMocks);
vi.mock("server-only", () => ({}));
vi.mock("~/server/admin/gear/service", () => serviceMocks);

import {
  actionClearGearLeftView,
  actionClearGearRearView,
  actionSetGearLeftView,
  actionSetGearRearView,
  actionSetGearRightView,
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

  it("revalidates dependent routes after setting side views", async () => {
    serviceMocks.setGearLeftViewService.mockResolvedValue({
      id: "gear-1",
      slug: "nikon-zf",
      leftViewUrl: "https://cdn.example.com/left.webp",
    });
    serviceMocks.setGearRightViewService.mockResolvedValue({
      id: "gear-1",
      slug: "nikon-zf",
      rightViewUrl: "https://cdn.example.com/right.webp",
    });

    await actionSetGearLeftView({
      gearId: "gear-1",
      leftViewUrl: "https://cdn.example.com/left.webp",
    });
    const result = await actionSetGearRightView({
      gearId: "gear-1",
      rightViewUrl: "https://cdn.example.com/right.webp",
    });

    expect(result).toMatchObject({
      slug: "nikon-zf",
      rightViewUrl: "https://cdn.example.com/right.webp",
    });
    expect(cacheMocks.revalidatePath).toHaveBeenCalledWith("/admin/gear");
    expect(cacheMocks.revalidatePath).toHaveBeenCalledWith("/gear/nikon-zf");
    expect(cacheMocks.revalidatePath).toHaveBeenCalledWith("/browse");
  });

  it("revalidates dependent routes after clearing a side view", async () => {
    serviceMocks.clearGearLeftViewService.mockResolvedValue({
      id: "gear-1",
      slug: "nikon-zf",
      leftViewUrl: null,
    });

    const result = await actionClearGearLeftView({
      gearId: "gear-1",
    });

    expect(result).toMatchObject({
      slug: "nikon-zf",
      leftViewUrl: null,
    });
    expect(cacheMocks.revalidatePath).toHaveBeenCalledWith("/admin/gear");
    expect(cacheMocks.revalidatePath).toHaveBeenCalledWith("/gear/nikon-zf");
    expect(cacheMocks.revalidatePath).toHaveBeenCalledWith("/browse");
  });
});
