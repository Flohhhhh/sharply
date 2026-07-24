import { beforeEach, describe, expect, it, vi } from "vitest";

const serviceMocks = vi.hoisted(() => ({
  fetchLensOpticsBackfillCandidatesService: vi.fn(),
}));

vi.mock("~/server/admin/gear/service", () => serviceMocks);

import { GET } from "../../src/app/api/admin/gear/optics-backfill/route";

describe("gear optics backfill route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serviceMocks.fetchLensOpticsBackfillCandidatesService.mockResolvedValue({
      eligibleCount: 80,
      actionableCount: 1,
      skippedCount: 0,
      items: [
        {
          id: "gear-1",
          slug: "canon-ef-8-15mm-f4l-fisheye-usm",
          name: "Canon EF 8-15mm f/4L Fisheye USM",
          publicationState: "PUBLISHED",
          proposal: {
            actionable: true,
            fills: ["focalLength", "isPrime", "maxApertureWide"],
            missing: ["focalLength", "isPrime", "maxApertureWide"],
            current: {
              focalLengthMinMm: null,
              focalLengthMaxMm: null,
              isPrime: null,
              maxApertureWide: null,
              maxApertureTele: null,
            },
            proposed: {
              focalLengthMinMm: 8,
              focalLengthMaxMm: 15,
              isPrime: false,
              maxApertureWide: 4,
            },
            after: {
              focalLengthMinMm: 8,
              focalLengthMaxMm: 15,
              isPrime: false,
              maxApertureWide: 4,
              maxApertureTele: null,
            },
          },
        },
      ],
    });
  });

  it("defaults to a 25-item review batch", async () => {
    const response = await GET(
      new Request("http://localhost/api/admin/gear/optics-backfill") as never,
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(
      serviceMocks.fetchLensOpticsBackfillCandidatesService,
    ).toHaveBeenCalledWith({ limit: 25 });
    expect(payload).toMatchObject({
      eligibleCount: 80,
      actionableCount: 1,
      limit: 25,
      returnedCount: 1,
    });
  });

  it("clamps review batches between 25 and 50", async () => {
    const tooSmall = await GET(
      new Request(
        "http://localhost/api/admin/gear/optics-backfill?limit=5",
      ) as never,
    );
    expect((await tooSmall.json()).limit).toBe(25);
    expect(
      serviceMocks.fetchLensOpticsBackfillCandidatesService,
    ).toHaveBeenCalledWith({ limit: 25 });

    const tooLarge = await GET(
      new Request(
        "http://localhost/api/admin/gear/optics-backfill?limit=500",
      ) as never,
    );
    expect((await tooLarge.json()).limit).toBe(50);
    expect(
      serviceMocks.fetchLensOpticsBackfillCandidatesService,
    ).toHaveBeenCalledWith({ limit: 50 });
  });
});
