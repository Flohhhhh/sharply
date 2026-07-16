import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

process.env.DATABASE_URL ??=
  "postgres://postgres:postgres@localhost:5432/sharply";
process.env.PAYLOAD_SECRET ??= "test-payload-secret";
process.env.NEXT_PUBLIC_BASE_URL ??= "http://localhost:3000";

const gearDataMocks = vi.hoisted(() => ({
  fetchAllGearForConstructionData: vi.fn(),
  fetchGearBySlug: vi.fn(),
  fetchGearSummariesBySlugs: vi.fn(),
}));

const constructionMocks = vi.hoisted(() => ({
  getConstructionState: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("~/server/db", () => ({
  db: {},
}));
vi.mock("~/auth", () => ({
  auth: {},
}));
vi.mock("~/server/admin/proposals/service", () => ({
  applyTrustedContributorProposalApproval: vi.fn(),
  approveProposal: vi.fn(),
}));
vi.mock("~/server/admin/proposals/webhook", () => ({
  notifyAutoApprovedChangeRequest: vi.fn(),
  notifyChangeRequestModerators: vi.fn(),
}));
vi.mock("~/server/reviews/moderation/service", () => ({
  testReviewSafety: vi.fn(),
}));
vi.mock("~/server/reviews/summary/service", () => ({
  maybeGenerateReviewSummary: vi.fn(),
}));
vi.mock("~/server/gear/data", () => gearDataMocks);
vi.mock("~/lib/utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~/lib/utils")>();
  return {
    ...actual,
    getConstructionState: constructionMocks.getConstructionState,
  };
});

import {
  fetchGearBySlug,
  fetchGearSummariesBySlugs,
  fetchRandomLowCompletionGearUrl,
  listUnderConstruction,
} from "~/server/gear/service";

function makeConstructionRow(params: {
  slug: string;
  publicationState: "PUBLISHED" | "RUMORED" | "HIDDEN";
  brandId?: string | null;
  mountId?: string | null;
  cameraAll?: Record<string, unknown> | null;
  createdAt?: Date;
}) {
  return {
    id: `${params.slug}-id`,
    slug: params.slug,
    name: params.slug,
    gearType: "CAMERA",
    publicationState: params.publicationState,
    thumbnailUrl: null,
    brandId: params.brandId === undefined ? "brand-1" : params.brandId,
    brandName: "Brand",
    mountId: params.mountId ?? null,
    mountIds: [],
    createdAt: params.createdAt ?? new Date("2026-06-18T00:00:00.000Z"),
    camera_sensorFormatId: null,
    camera_resolutionMp: null,
    analog_cameraType: null,
    analog_captureMedium: null,
    fixed_focalMin: null,
    fixed_focalMax: null,
    lens_focalMin: null,
    lens_focalMax: null,
    lens_isPrime: null,
    lens_maxApertureWide: null,
    lens_imageCircleSizeId: null,
    cameraAll: params.cameraAll ?? null,
    analogAll: null,
    lensAll: null,
    fixedAll: null,
  };
}

function makeCompletionFields(filled: number, total: number) {
  return Object.fromEntries(
    Array.from({ length: total }, (_, index) => [
      `field-${index}`,
      index < filled ? `value-${index}` : null,
    ]),
  );
}

describe("gear publication state service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns published gear by default", async () => {
    gearDataMocks.fetchGearBySlug.mockResolvedValue({
      id: "gear-1",
      slug: "nikon-z6iii",
      publicationState: "PUBLISHED",
    });

    await expect(fetchGearBySlug("nikon-z6iii")).resolves.toMatchObject({
      slug: "nikon-z6iii",
      publicationState: "PUBLISHED",
    });
  });

  it("hides rumored gear unless the caller explicitly opts in", async () => {
    gearDataMocks.fetchGearBySlug.mockResolvedValue({
      id: "gear-2",
      slug: "nikon-z9ii",
      publicationState: "RUMORED",
    });

    await expect(fetchGearBySlug("nikon-z9ii")).rejects.toMatchObject({
      status: 404,
    });

    await expect(
      fetchGearBySlug("nikon-z9ii", { includeRumored: true }),
    ).resolves.toMatchObject({
      slug: "nikon-z9ii",
      publicationState: "RUMORED",
    });
  });

  it("keeps hidden gear behind an explicit emergency override", async () => {
    gearDataMocks.fetchGearBySlug.mockResolvedValue({
      id: "gear-3",
      slug: "nikon-z8",
      publicationState: "HIDDEN",
    });

    await expect(
      fetchGearBySlug("nikon-z8", { includeRumored: true }),
    ).rejects.toMatchObject({
      status: 404,
    });

    await expect(
      fetchGearBySlug("nikon-z8", {
        includeRumored: true,
        includeHidden: true,
      }),
    ).resolves.toMatchObject({
      slug: "nikon-z8",
      publicationState: "HIDDEN",
    });
  });

  it("filters lightweight gear summaries by publication state by default", async () => {
    gearDataMocks.fetchGearSummariesBySlugs.mockResolvedValue([
      {
        id: "gear-1",
        slug: "canon-r5ii",
        name: "Canon R5 II",
        brandName: "Canon",
        thumbnailUrl: null,
        releaseDate: null,
        releaseDatePrecision: null,
        announcedDate: null,
        announceDatePrecision: null,
        publicationState: "PUBLISHED",
      },
      {
        id: "gear-2",
        slug: "canon-r7ii",
        name: "Canon R7 II",
        brandName: "Canon",
        thumbnailUrl: null,
        releaseDate: null,
        releaseDatePrecision: null,
        announcedDate: null,
        announceDatePrecision: null,
        publicationState: "RUMORED",
      },
      {
        id: "gear-3",
        slug: "canon-r1-mark-ii",
        name: "Canon R1 Mark II",
        brandName: "Canon",
        thumbnailUrl: null,
        releaseDate: null,
        releaseDatePrecision: null,
        announcedDate: null,
        announceDatePrecision: null,
        publicationState: "HIDDEN",
      },
    ]);

    await expect(
      fetchGearSummariesBySlugs([
        "canon-r5ii",
        "canon-r7ii",
        "canon-r1-mark-ii",
      ]),
    ).resolves.toEqual([
      expect.objectContaining({
        slug: "canon-r5ii",
        publicationState: "PUBLISHED",
      }),
    ]);
  });

  it("allows rumored and hidden summaries when explicitly requested", async () => {
    gearDataMocks.fetchGearSummariesBySlugs.mockResolvedValue([
      {
        id: "gear-1",
        slug: "canon-r7ii",
        name: "Canon R7 II",
        brandName: "Canon",
        thumbnailUrl: null,
        releaseDate: null,
        releaseDatePrecision: null,
        announcedDate: null,
        announceDatePrecision: null,
        publicationState: "RUMORED",
      },
      {
        id: "gear-2",
        slug: "canon-r1-mark-ii",
        name: "Canon R1 Mark II",
        brandName: "Canon",
        thumbnailUrl: null,
        releaseDate: null,
        releaseDatePrecision: null,
        announcedDate: null,
        announceDatePrecision: null,
        publicationState: "HIDDEN",
      },
    ]);

    await expect(
      fetchGearSummariesBySlugs(["canon-r7ii", "canon-r1-mark-ii"], {
        includeRumored: true,
        includeHidden: true,
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        slug: "canon-r7ii",
        publicationState: "RUMORED",
      }),
      expect.objectContaining({
        slug: "canon-r1-mark-ii",
        publicationState: "HIDDEN",
      }),
    ]);
  });

  it("excludes rumored and hidden items from the under-construction list", async () => {
    gearDataMocks.fetchAllGearForConstructionData.mockResolvedValue([
      makeConstructionRow({
        slug: "canon-r5ii",
        publicationState: "PUBLISHED",
      }),
      makeConstructionRow({
        slug: "canon-r7ii",
        publicationState: "RUMORED",
      }),
      makeConstructionRow({
        slug: "canon-r1-mark-ii",
        publicationState: "HIDDEN",
      }),
    ]);
    constructionMocks.getConstructionState.mockReturnValue({
      underConstruction: true,
      missing: ["sensorFormatId"],
      completionPercent: 10,
    });

    const rows = await listUnderConstruction();

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      slug: "canon-r5ii",
      underConstruction: true,
    });
  });

  it("selects uniformly from the same candidate pool as the under-construction page", async () => {
    gearDataMocks.fetchAllGearForConstructionData.mockResolvedValue([
      makeConstructionRow({
        slug: "missing-required-field",
        publicationState: "PUBLISHED",
        mountId: "mount-1",
        cameraAll: makeCompletionFields(4, 4),
      }),
      makeConstructionRow({
        slug: "low-completion",
        publicationState: "PUBLISHED",
        mountId: "mount-1",
        cameraAll: makeCompletionFields(0, 4),
      }),
      makeConstructionRow({
        slug: "complete",
        publicationState: "PUBLISHED",
        mountId: "mount-1",
        cameraAll: makeCompletionFields(4, 4),
      }),
    ]);
    constructionMocks.getConstructionState.mockImplementation(
      (item: { slug: string }) =>
        item.slug === "missing-required-field"
          ? {
              underConstruction: true,
              missing: ["Sensor type"],
            }
          : { underConstruction: false, missing: [] },
    );
    vi.spyOn(Math, "random").mockReturnValue(0.75);

    await expect(fetchRandomLowCompletionGearUrl()).resolves.toBe(
      "/gear/low-completion",
    );
    expect(gearDataMocks.fetchAllGearForConstructionData).toHaveBeenCalledTimes(
      1,
    );
  });

  it("falls back to a random item from only the 20 lowest completion rows", async () => {
    gearDataMocks.fetchAllGearForConstructionData.mockResolvedValue(
      Array.from({ length: 21 }, (_, index) =>
        makeConstructionRow({
          slug: `fallback-${index}`,
          publicationState: "PUBLISHED",
          mountId: "mount-1",
          cameraAll: makeCompletionFields(19 + index, 50),
        }),
      ),
    );
    constructionMocks.getConstructionState.mockReturnValue({
      underConstruction: false,
      missing: [],
    });
    vi.spyOn(Math, "random").mockReturnValue(0.999);

    await expect(fetchRandomLowCompletionGearUrl()).resolves.toBe(
      "/gear/fallback-19",
    );
  });

  it("returns null when there is no published gear", async () => {
    gearDataMocks.fetchAllGearForConstructionData.mockResolvedValue([]);

    await expect(fetchRandomLowCompletionGearUrl()).resolves.toBeNull();
    expect(constructionMocks.getConstructionState).not.toHaveBeenCalled();
  });
});
