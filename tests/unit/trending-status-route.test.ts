import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const popularityMocks = vi.hoisted(() => ({
  getLiveTrendingStatusForSlugs: vi.fn(),
}));

vi.mock("~/server/popularity/service", () => popularityMocks);

import { GET } from "~/app/api/trending/status/route";

const BRAND_ID = "a19fbe71-3a17-4095-8d79-f40eb5475480";
const MOUNT_ID = "21323f59-f91a-418a-8f88-09aeacd0f84d";

describe("trending status route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns live status only for the requested gear", async () => {
    popularityMocks.getLiveTrendingStatusForSlugs.mockResolvedValue(
      new Set(["nikon-zf"]),
    );
    const request = new NextRequest(
      `http://localhost/api/trending/status?slug=nikon-zf&slug=sony-a7-iv&timeframe=30d&limit=20&brandId=${BRAND_ID}&mountId=${MOUNT_ID}`,
    );

    const response = await GET(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      trendingSlugs: ["nikon-zf"],
    });
    expect(popularityMocks.getLiveTrendingStatusForSlugs).toHaveBeenCalledWith(
      ["nikon-zf", "sony-a7-iv"],
      {
        timeframe: "30d",
        limit: 20,
        filters: {
          brandId: BRAND_ID,
          mountId: MOUNT_ID,
          gearType: undefined,
        },
      },
    );
  });

  it("rejects invalid or missing slugs", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/trending/status"),
    );

    expect(response.status).toBe(400);
    expect(
      popularityMocks.getLiveTrendingStatusForSlugs,
    ).not.toHaveBeenCalled();
  });

  it("rejects malformed filter IDs before querying rankings", async () => {
    const response = await GET(
      new NextRequest(
        "http://localhost/api/trending/status?slug=nikon-zf&mountId=not-a-uuid",
      ),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "brandId and mountId must be valid UUIDs",
    });
    expect(
      popularityMocks.getLiveTrendingStatusForSlugs,
    ).not.toHaveBeenCalled();
  });
});
