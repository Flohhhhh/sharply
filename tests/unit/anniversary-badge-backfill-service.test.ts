import { beforeEach,describe,expect,it,vi } from "vitest";

const dataMocks = vi.hoisted(() => ({
  fetchAnniversaryBackfillCandidates: vi.fn(),
  fetchRecentBadgeAwards: vi.fn(),
  fetchUserBadgesData: vi.fn(),
  getUserSnapshot: vi.fn(),
  upsertUserBadge: vi.fn(),
}));

const notificationMocks = vi.hoisted(() => ({
  createNotification: vi.fn(),
}));

const userServiceMocks = vi.hoisted(() => ({
  fetchUserById: vi.fn(),
}));

vi.mock("~/server/badges/data", () => dataMocks);
vi.mock("~/server/notifications/service", () => notificationMocks);
vi.mock("~/server/users/service", () => userServiceMocks);
vi.mock("server-only", () => ({}));

import { runAnniversaryBackfill } from "~/server/badges/service";

describe("runAnniversaryBackfill", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dataMocks.fetchAnniversaryBackfillCandidates.mockResolvedValue({
      scannedUsers: 0,
      candidates: [],
    });
    userServiceMocks.fetchUserById.mockResolvedValue({
      handle: "test-user",
      memberNumber: 42,
    });
    dataMocks.upsertUserBadge.mockResolvedValue(true);
  });

  it("reports dry-run results without writing badge rows", async () => {
    dataMocks.fetchAnniversaryBackfillCandidates.mockResolvedValue({
      scannedUsers: 12,
      candidates: [
        {
          userId: "user-1",
          joinDate: new Date("2025-05-01T00:00:00.000Z"),
          diffDays: 378,
          missingBadgeKeys: ["anniversary_7", "anniversary_30"],
        },
      ],
    });

    await expect(runAnniversaryBackfill()).resolves.toEqual({
      dryRun: true,
      eligibleUsers: 1,
      processedUsers: 1,
      scannedUsers: 12,
      totalAwards: 2,
      sample: [
        {
          userId: "user-1",
          joinDate: new Date("2025-05-01T00:00:00.000Z"),
          diffDays: 378,
          missingBadgeKeys: ["anniversary_7", "anniversary_30"],
        },
      ],
    });

    expect(dataMocks.upsertUserBadge).not.toHaveBeenCalled();
    expect(notificationMocks.createNotification).not.toHaveBeenCalled();
  });

  it("awards only missing anniversary badges during a live run", async () => {
    dataMocks.fetchAnniversaryBackfillCandidates.mockResolvedValue({
      scannedUsers: 20,
      candidates: [
        {
          userId: "user-2",
          joinDate: new Date("2024-05-01T00:00:00.000Z"),
          diffDays: 743,
          missingBadgeKeys: ["anniversary_7", "anniversary_30"],
        },
      ],
    });

    const result = await runAnniversaryBackfill({ dryRun: false });

    expect(result).toEqual({
      dryRun: false,
      eligibleUsers: 1,
      processedUsers: 1,
      scannedUsers: 20,
      totalAwards: 2,
      sample: [
        {
          userId: "user-2",
          joinDate: new Date("2024-05-01T00:00:00.000Z"),
          diffDays: 743,
          missingBadgeKeys: ["anniversary_7", "anniversary_30"],
        },
      ],
    });
    expect(dataMocks.upsertUserBadge).toHaveBeenCalledTimes(2);
    expect(dataMocks.upsertUserBadge).toHaveBeenNthCalledWith(1, {
      userId: "user-2",
      badgeKey: "anniversary_7",
      context: expect.objectContaining({ reason: "anniversary_backfill" }),
      source: "auto",
      eventType: "cron.anniversary.backfill",
    });
    expect(dataMocks.upsertUserBadge).toHaveBeenNthCalledWith(2, {
      userId: "user-2",
      badgeKey: "anniversary_30",
      context: expect.objectContaining({ reason: "anniversary_backfill" }),
      source: "auto",
      eventType: "cron.anniversary.backfill",
    });
    expect(notificationMocks.createNotification).toHaveBeenCalledTimes(2);
    expect(userServiceMocks.fetchUserById).toHaveBeenCalledTimes(1);
  });

  it("is idempotent when badge rows already exist by the time it writes", async () => {
    dataMocks.fetchAnniversaryBackfillCandidates.mockResolvedValue({
      scannedUsers: 5,
      candidates: [
        {
          userId: "user-3",
          joinDate: new Date("2024-05-01T00:00:00.000Z"),
          diffDays: 743,
          missingBadgeKeys: ["anniversary_7"],
        },
      ],
    });
    dataMocks.upsertUserBadge.mockResolvedValue(false);

    await expect(
      runAnniversaryBackfill({ dryRun: false }),
    ).resolves.toEqual({
      dryRun: false,
      eligibleUsers: 1,
      processedUsers: 1,
      scannedUsers: 5,
      totalAwards: 0,
      sample: [
        {
          userId: "user-3",
          joinDate: new Date("2024-05-01T00:00:00.000Z"),
          diffDays: 743,
          missingBadgeKeys: ["anniversary_7"],
        },
      ],
    });

    expect(notificationMocks.createNotification).not.toHaveBeenCalled();
  });

  it("passes limit through to the backfill candidate query", async () => {
    await runAnniversaryBackfill({
      dryRun: false,
      limit: 3,
      now: 123,
    });

    expect(dataMocks.fetchAnniversaryBackfillCandidates).toHaveBeenCalledWith({
      anniversaryBadges: expect.any(Array),
      limit: 3,
      now: 123,
    });
  });
});
