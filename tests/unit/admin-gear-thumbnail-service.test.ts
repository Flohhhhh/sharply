import { beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  getSessionOrThrow: vi.fn(),
}));

const adminGearDataMocks = vi.hoisted(() => ({
  checkGearCreationData: vi.fn(),
  createGearData: vi.fn(),
  deleteGearData: vi.fn(),
  fetchAdminGearItemsData: vi.fn(),
  fetchGearOgBackfillCandidatesData: vi.fn(),
  performFuzzySearch: vi.fn(),
  renameGearData: vi.fn(),
  updateGearOgImageData: vi.fn(),
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
  insertedValues: [] as unknown[],
}));

const dbMocks = vi.hoisted(() => ({
  insert: vi.fn(() => ({
    values: vi.fn(async (payload: unknown) => {
      dbState.insertedValues.push(payload);
    }),
  })),
  transaction: vi.fn(),
}));

const cacheMocks = vi.hoisted(() => ({
  invalidateCatalog: vi.fn(),
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
vi.mock("~/server/developer-api/cache", () => ({
  invalidateDeveloperApiCatalogCache: cacheMocks.invalidateCatalog,
}));

import {
  clearGearThumbnailService,
  setGearOgImageService,
  setGearThumbnailService,
} from "~/server/admin/gear/service";

describe("thumbnail gear admin service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbState.insertedValues = [];
    authMocks.getSessionOrThrow.mockResolvedValue({
      user: { id: "editor-1", role: "EDITOR" },
    });
    gearDataMocks.getGearIdBySlug.mockResolvedValue("gear-1");
  });

  it("stores both thumbnail and OG asset on the first thumbnail upload", async () => {
    gearDataMocks.fetchGearMetadataById.mockResolvedValue({
      thumbnailUrl: null,
    });
    adminGearDataMocks.updateGearThumbnailData.mockResolvedValue({
      id: "gear-1",
      slug: "nikon-z6iii",
      thumbnailUrl: "https://cdn.example.com/front.jpg",
      ogImageUrl: "https://cdn.example.com/front-og.jpg",
    });

    const result = await setGearThumbnailService({
      slug: "nikon-z6iii",
      thumbnailUrl: "https://cdn.example.com/front.jpg",
      ogImageUrl: "https://cdn.example.com/front-og.jpg",
    });

    expect(result).toMatchObject({
      slug: "nikon-z6iii",
      thumbnailUrl: "https://cdn.example.com/front.jpg",
      ogImageUrl: "https://cdn.example.com/front-og.jpg",
    });
    expect(adminGearDataMocks.updateGearThumbnailData).toHaveBeenCalledWith({
      gearId: "gear-1",
      thumbnailUrl: "https://cdn.example.com/front.jpg",
      ogImageUrl: "https://cdn.example.com/front-og.jpg",
    });
    expect(gearDataMocks.clearImageRequestsForGear).toHaveBeenCalledWith(
      "gear-1",
    );
    expect(dbState.insertedValues[0]).toMatchObject({
      action: "GEAR_IMAGE_UPLOAD",
      gearId: "gear-1",
    });
    expect(cacheMocks.invalidateCatalog).toHaveBeenCalledTimes(1);
  });

  it("clears any stored OG asset when replacing an existing thumbnail", async () => {
    gearDataMocks.fetchGearMetadataById.mockResolvedValue({
      thumbnailUrl: "https://cdn.example.com/old-front.jpg",
    });
    adminGearDataMocks.updateGearThumbnailData.mockResolvedValue({
      id: "gear-1",
      slug: "nikon-z6iii",
      thumbnailUrl: "https://cdn.example.com/new-front.jpg",
      ogImageUrl: null,
    });

    await setGearThumbnailService({
      gearId: "gear-1",
      thumbnailUrl: "https://cdn.example.com/new-front.jpg",
      ogImageUrl: null,
    });

    expect(adminGearDataMocks.updateGearThumbnailData).toHaveBeenCalledWith({
      gearId: "gear-1",
      thumbnailUrl: "https://cdn.example.com/new-front.jpg",
      ogImageUrl: null,
    });
    expect(dbState.insertedValues[0]).toMatchObject({
      action: "GEAR_IMAGE_REPLACE",
    });
  });

  it("does not invalidate the catalog when only the OG asset changes", async () => {
    gearDataMocks.fetchGearMetadataById.mockResolvedValue({
      thumbnailUrl: "https://cdn.example.com/front.jpg",
    });
    adminGearDataMocks.updateGearThumbnailData.mockResolvedValue({
      id: "gear-1",
      slug: "nikon-z6iii",
      thumbnailUrl: "https://cdn.example.com/front.jpg",
      ogImageUrl: "https://cdn.example.com/front-og.jpg",
    });

    await setGearThumbnailService({
      gearId: "gear-1",
      thumbnailUrl: "https://cdn.example.com/front.jpg",
      ogImageUrl: "https://cdn.example.com/front-og.jpg",
    });

    expect(cacheMocks.invalidateCatalog).not.toHaveBeenCalled();
  });

  it("clearing a thumbnail also clears the stored OG asset", async () => {
    gearDataMocks.fetchGearMetadataById.mockResolvedValue({
      thumbnailUrl: "https://cdn.example.com/front.jpg",
    });
    adminGearDataMocks.updateGearThumbnailData.mockResolvedValue({
      id: "gear-1",
      slug: "nikon-z6iii",
      thumbnailUrl: null,
      ogImageUrl: null,
    });

    const result = await clearGearThumbnailService({ gearId: "gear-1" });

    expect(result).toMatchObject({
      thumbnailUrl: null,
      ogImageUrl: null,
    });
    expect(adminGearDataMocks.updateGearThumbnailData).toHaveBeenCalledWith({
      gearId: "gear-1",
      thumbnailUrl: null,
      ogImageUrl: null,
    });
  });

  it("updates stored OG assets directly for admin backfill runs", async () => {
    adminGearDataMocks.updateGearOgImageData.mockResolvedValue({
      id: "gear-1",
      slug: "nikon-z6iii",
      ogImageUrl: "https://cdn.example.com/front-og.jpg",
    });

    const result = await setGearOgImageService({
      slug: "nikon-z6iii",
      ogImageUrl: "https://cdn.example.com/front-og.jpg",
    });

    expect(result).toMatchObject({
      slug: "nikon-z6iii",
      ogImageUrl: "https://cdn.example.com/front-og.jpg",
    });
    expect(adminGearDataMocks.updateGearOgImageData).toHaveBeenCalledWith({
      gearId: "gear-1",
      ogImageUrl: "https://cdn.example.com/front-og.jpg",
    });
    expect(cacheMocks.invalidateCatalog).not.toHaveBeenCalled();
  });
});
