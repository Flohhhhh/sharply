import { beforeEach, describe, expect, it, vi } from "vitest";

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
  listUnderConstruction,
} from "~/server/gear/service";

function makeConstructionRow(params: {
  slug: string;
  publicationState: "PUBLISHED" | "RUMORED" | "HIDDEN";
}) {
  return {
    id: `${params.slug}-id`,
    slug: params.slug,
    name: params.slug,
    gearType: "CAMERA",
    publicationState: params.publicationState,
    thumbnailUrl: null,
    brandId: "brand-1",
    brandName: "Brand",
    mountId: null,
    mountIds: [],
    createdAt: new Date("2026-06-18T00:00:00.000Z"),
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
    cameraAll: null,
    analogAll: null,
    lensAll: null,
    fixedAll: null,
  };
}

describe("gear publication state service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
