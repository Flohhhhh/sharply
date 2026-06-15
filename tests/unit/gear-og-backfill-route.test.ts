import { beforeEach,describe,expect,it,vi } from "vitest";

const serviceMocks = vi.hoisted(() => ({
  fetchGearOgBackfillCandidatesService: vi.fn(),
}));

vi.mock("~/server/admin/gear/service", () => serviceMocks);

import { GET } from "../../src/app/api/admin/gear/og-backfill/route";

describe("gear OG backfill route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serviceMocks.fetchGearOgBackfillCandidatesService.mockResolvedValue({
      eligibleCount: 12,
      items: [
        {
          id: "gear-1",
          slug: "nikon-z6iii",
          name: "Nikon Z6III",
          thumbnailUrl: "https://cdn.example.com/thumb.jpg",
          ogImageUrl: null,
        },
      ],
    });
  });

  it("defaults to missing-only mode with the standard limit", async () => {
    const response = await GET(
      new Request("http://localhost/api/admin/gear/og-backfill") as any,
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(serviceMocks.fetchGearOgBackfillCandidatesService).toHaveBeenCalledWith({
      includeExisting: false,
      limit: 25,
    });
    expect(payload).toMatchObject({
      eligibleCount: 12,
      includeExisting: false,
      limit: 25,
      returnedCount: 1,
    });
  });

  it("supports all-mode scans and clamps large limits", async () => {
    const response = await GET(
      new Request("http://localhost/api/admin/gear/og-backfill?mode=all&limit=500") as any,
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(serviceMocks.fetchGearOgBackfillCandidatesService).toHaveBeenCalledWith({
      includeExisting: true,
      limit: 100,
    });
    expect(payload.limit).toBe(100);
    expect(payload.includeExisting).toBe(true);
  });
});
