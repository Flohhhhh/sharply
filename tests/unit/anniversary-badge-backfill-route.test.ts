import { beforeEach,describe,expect,it,vi } from "vitest";

const envMocks = vi.hoisted(() => ({
  env: {
    CRON_SECRET: "cron-secret",
    NODE_ENV: "test",
  },
}));

const badgeServiceMocks = vi.hoisted(() => ({
  runAnniversaryBackfill: vi.fn(),
}));

vi.mock("~/env", () => envMocks);
vi.mock("~/server/badges/service", () => badgeServiceMocks);

import {
  GET,
  POST,
} from "../../src/app/api/admin/badges/anniversary/backfill/route";

describe("anniversary badge backfill route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    badgeServiceMocks.runAnniversaryBackfill.mockResolvedValue({
      dryRun: true,
      eligibleUsers: 0,
      processedUsers: 0,
      scannedUsers: 0,
      totalAwards: 0,
      sample: [],
    });
  });

  it("returns 401 without the cron bearer token", async () => {
    const response = await GET(
      new Request("http://localhost/api/admin/badges/anniversary/backfill") as any,
    );
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toEqual({ error: "Unauthorized" });
    expect(badgeServiceMocks.runAnniversaryBackfill).not.toHaveBeenCalled();
  });

  it("defaults GET requests to dry-run mode", async () => {
    const response = await GET(
      new Request("http://localhost/api/admin/badges/anniversary/backfill", {
        headers: { Authorization: "Bearer cron-secret" },
      }) as any,
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      ok: true,
      dryRun: true,
      eligibleUsers: 0,
      processedUsers: 0,
      scannedUsers: 0,
      totalAwards: 0,
      sample: [],
    });
    expect(badgeServiceMocks.runAnniversaryBackfill).toHaveBeenCalledWith({
      dryRun: true,
      limit: undefined,
    });
  });

  it("allows authorized POST requests to run a live backfill with a limit", async () => {
    badgeServiceMocks.runAnniversaryBackfill.mockResolvedValue({
      dryRun: false,
      eligibleUsers: 2,
      processedUsers: 2,
      scannedUsers: 10,
      totalAwards: 3,
      sample: [
        {
          userId: "user-1",
          joinDate: new Date("2025-01-01T00:00:00.000Z"),
          diffDays: 120,
          missingBadgeKeys: ["anniversary_7"],
        },
      ],
    });

    const response = await POST(
      new Request(
        "http://localhost/api/admin/badges/anniversary/backfill?dryRun=false&limit=2",
        {
          method: "POST",
          headers: { Authorization: "Bearer cron-secret" },
        },
      ) as any,
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(badgeServiceMocks.runAnniversaryBackfill).toHaveBeenCalledWith({
      dryRun: false,
      limit: 2,
    });
    expect(payload.totalAwards).toBe(3);
  });
});
