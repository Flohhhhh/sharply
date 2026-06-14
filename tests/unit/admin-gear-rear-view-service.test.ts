import { beforeEach,describe,expect,it,vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  getSessionOrThrow: vi.fn(),
}));

const adminGearDataMocks = vi.hoisted(() => ({
  checkGearCreationData: vi.fn(),
  createGearData: vi.fn(),
  deleteGearData: vi.fn(),
  fetchAdminGearItemsData: vi.fn(),
  performFuzzySearch: vi.fn(),
  renameGearData: vi.fn(),
  updateGearRearViewData: vi.fn(),
  updateGearThumbnailData: vi.fn(),
  updateGearTopViewData: vi.fn(),
}));

const gearDataMocks = vi.hoisted(() => ({
  clearImageRequestsForGear: vi.fn(),
  fetchGearMetadataById: vi.fn(),
  getGearIdBySlug: vi.fn(),
}));

const dbState = vi.hoisted(() => ({
  insertedTargets: [] as unknown[],
  insertedValues: [] as unknown[],
}));

const dbMocks = vi.hoisted(() => ({
  insert: vi.fn((target: unknown) => ({
    values: vi.fn(async (payload: unknown) => {
      dbState.insertedTargets.push(target);
      dbState.insertedValues.push(payload);
    }),
  })),
  transaction: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("~/server/auth", () => authMocks);
vi.mock("~/server/db", () => ({
  db: dbMocks,
}));
vi.mock("~/server/db/schema", () => ({
  auditLogs: { table: "audit_logs" },
  brands: {},
  gear: {},
  gearAliases: {},
  gearEdits: { table: "gear_edits" },
}));
vi.mock("~/server/admin/gear/data", () => adminGearDataMocks);
vi.mock("~/server/gear/data", () => gearDataMocks);

import {
  clearGearRearViewService,
  setGearRearViewService,
} from "~/server/admin/gear/service";

describe("rear view gear admin service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbState.insertedTargets = [];
    dbState.insertedValues = [];
    authMocks.getSessionOrThrow.mockResolvedValue({
      user: { id: "editor-1", role: "EDITOR" },
    });
    gearDataMocks.getGearIdBySlug.mockResolvedValue("gear-1");
  });

  it("uploads a rear view, clears image requests, and records contribution metadata", async () => {
    gearDataMocks.fetchGearMetadataById.mockResolvedValue({
      gearType: "CAMERA",
      rearViewUrl: null,
    });
    adminGearDataMocks.updateGearRearViewData.mockResolvedValue({
      id: "gear-1",
      slug: "nikon-zf",
      rearViewUrl: "https://cdn.example.com/rear.webp",
    });

    const result = await setGearRearViewService({
      slug: "nikon-zf",
      rearViewUrl: "https://cdn.example.com/rear.webp",
    });

    expect(result).toEqual({
      id: "gear-1",
      slug: "nikon-zf",
      rearViewUrl: "https://cdn.example.com/rear.webp",
    });
    expect(gearDataMocks.getGearIdBySlug).toHaveBeenCalledWith("nikon-zf");
    expect(adminGearDataMocks.updateGearRearViewData).toHaveBeenCalledWith({
      gearId: "gear-1",
      rearViewUrl: "https://cdn.example.com/rear.webp",
    });
    expect(gearDataMocks.clearImageRequestsForGear).toHaveBeenCalledWith(
      "gear-1",
    );
    expect(dbState.insertedValues[0]).toMatchObject({
      action: "GEAR_REAR_VIEW_UPLOAD",
      actorUserId: "editor-1",
      gearId: "gear-1",
    });
    expect(dbState.insertedValues[1]).toMatchObject({
      gearId: "gear-1",
      createdById: "editor-1",
      status: "APPROVED",
      payload: {
        imageUpload: {
          type: "rearView",
          url: "https://cdn.example.com/rear.webp",
          action: "upload",
        },
      },
    });
  });

  it("records rear view replacements distinctly from first uploads", async () => {
    gearDataMocks.fetchGearMetadataById.mockResolvedValue({
      gearType: "CAMERA",
      rearViewUrl: "https://cdn.example.com/old-rear.webp",
    });
    adminGearDataMocks.updateGearRearViewData.mockResolvedValue({
      id: "gear-1",
      slug: "nikon-zf",
      rearViewUrl: "https://cdn.example.com/new-rear.webp",
    });

    await setGearRearViewService({
      gearId: "gear-1",
      rearViewUrl: "https://cdn.example.com/new-rear.webp",
    });

    expect(dbState.insertedValues[0]).toMatchObject({
      action: "GEAR_REAR_VIEW_REPLACE",
    });
    expect(dbState.insertedValues[1]).toMatchObject({
      payload: {
        imageUpload: {
          type: "rearView",
          action: "replace",
        },
      },
    });
  });

  it("clears a rear view without creating a contribution record", async () => {
    authMocks.getSessionOrThrow.mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    });
    gearDataMocks.fetchGearMetadataById.mockResolvedValue({
      gearType: "CAMERA",
      rearViewUrl: "https://cdn.example.com/old-rear.webp",
    });
    adminGearDataMocks.updateGearRearViewData.mockResolvedValue({
      id: "gear-1",
      slug: "nikon-zf",
      rearViewUrl: null,
    });

    const result = await clearGearRearViewService({ gearId: "gear-1" });

    expect(result).toEqual({
      id: "gear-1",
      slug: "nikon-zf",
      rearViewUrl: null,
    });
    expect(gearDataMocks.clearImageRequestsForGear).not.toHaveBeenCalled();
    expect(dbState.insertedValues).toHaveLength(1);
    expect(dbState.insertedValues[0]).toMatchObject({
      action: "GEAR_REAR_VIEW_REMOVE",
      actorUserId: "admin-1",
      gearId: "gear-1",
    });
  });

  it("rejects users without editor access", async () => {
    authMocks.getSessionOrThrow.mockResolvedValue({
      user: { id: "user-1", role: "USER" },
    });

    await expect(
      setGearRearViewService({
        gearId: "gear-1",
        rearViewUrl: "https://cdn.example.com/rear.webp",
      }),
    ).rejects.toMatchObject({ message: "Unauthorized", status: 401 });
    expect(adminGearDataMocks.updateGearRearViewData).not.toHaveBeenCalled();
    expect(dbState.insertedValues).toHaveLength(0);
  });

  it("rejects rear views for lenses", async () => {
    gearDataMocks.fetchGearMetadataById.mockResolvedValue({
      gearType: "LENS",
      rearViewUrl: null,
    });

    await expect(
      setGearRearViewService({
        gearId: "gear-1",
        rearViewUrl: "https://cdn.example.com/rear.webp",
      }),
    ).rejects.toMatchObject({
      message: "Rear-view images are only supported for cameras",
      status: 400,
      code: "REAR_VIEW_UNSUPPORTED_GEAR_TYPE",
    });

    expect(adminGearDataMocks.updateGearRearViewData).not.toHaveBeenCalled();
    expect(gearDataMocks.clearImageRequestsForGear).not.toHaveBeenCalled();
    expect(dbState.insertedValues).toHaveLength(0);
  });

  it("allows rear views for analog cameras", async () => {
    gearDataMocks.fetchGearMetadataById.mockResolvedValue({
      gearType: "ANALOG_CAMERA",
      rearViewUrl: null,
    });
    adminGearDataMocks.updateGearRearViewData.mockResolvedValue({
      id: "gear-1",
      slug: "nikon-f3",
      rearViewUrl: "https://cdn.example.com/rear.webp",
    });

    const result = await setGearRearViewService({
      gearId: "gear-1",
      rearViewUrl: "https://cdn.example.com/rear.webp",
    });

    expect(result).toMatchObject({
      slug: "nikon-f3",
      rearViewUrl: "https://cdn.example.com/rear.webp",
    });
    expect(adminGearDataMocks.updateGearRearViewData).toHaveBeenCalled();
  });
});
