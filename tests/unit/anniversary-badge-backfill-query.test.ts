import { beforeEach,describe,expect,it,vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("~/server/db", () => ({ db: {} }));
vi.mock("~/server/db/schema", () => ({
  badgeAwardsLog: {},
  gearEdits: {},
  ownerships: {},
  reviews: {},
  userBadges: {},
  users: {},
  wishlists: {},
}));
vi.mock("drizzle-orm", () => ({
  and: vi.fn(),
  asc: vi.fn(),
  count: vi.fn(),
  desc: vi.fn(),
  eq: vi.fn(),
  inArray: vi.fn(),
  lte: vi.fn(),
}));

import { buildAnniversaryBackfillCandidates } from "~/server/badges/data";

describe("buildAnniversaryBackfillCandidates", () => {
  const anniversaryBadges = [
    { key: "anniversary_7", days: 7 },
    { key: "anniversary_30", days: 30 },
    { key: "anniversary_365", days: 365 },
  ];
  const now = new Date("2026-05-14T12:00:00.000Z").getTime();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns users eligible for a single missing anniversary badge", () => {
    const candidates = buildAnniversaryBackfillCandidates({
      anniversaryBadges,
      now,
      users: [
        {
          id: "user-1",
          createdAt: new Date("2026-05-01T00:00:00.000Z"),
          existingBadgeKeys: [],
        },
      ],
    });

    expect(candidates).toEqual([
      expect.objectContaining({
        userId: "user-1",
        missingBadgeKeys: ["anniversary_7"],
      }),
    ]);
  });

  it("returns all missing tiers already crossed by the user", () => {
    const candidates = buildAnniversaryBackfillCandidates({
      anniversaryBadges,
      now,
      users: [
        {
          id: "user-2",
          createdAt: new Date("2025-05-01T00:00:00.000Z"),
          existingBadgeKeys: ["anniversary_7"],
        },
      ],
    });

    expect(candidates).toEqual([
      expect.objectContaining({
        userId: "user-2",
        missingBadgeKeys: ["anniversary_30", "anniversary_365"],
      }),
    ]);
  });

  it("skips users who already have all anniversary badges they qualify for", () => {
    const candidates = buildAnniversaryBackfillCandidates({
      anniversaryBadges,
      now,
      users: [
        {
          id: "user-3",
          createdAt: new Date("2025-05-01T00:00:00.000Z"),
          existingBadgeKeys: [
            "anniversary_7",
            "anniversary_30",
            "anniversary_365",
          ],
        },
      ],
    });

    expect(candidates).toEqual([]);
  });

  it("skips users below the first anniversary threshold", () => {
    const candidates = buildAnniversaryBackfillCandidates({
      anniversaryBadges,
      now,
      users: [
        {
          id: "user-4",
          createdAt: new Date("2026-05-10T00:00:00.000Z"),
          existingBadgeKeys: [],
        },
      ],
    });

    expect(candidates).toEqual([]);
  });

  it("ignores non-anniversary badge keys when checking missing tiers", () => {
    const candidates = buildAnniversaryBackfillCandidates({
      anniversaryBadges,
      now,
      users: [
        {
          id: "user-5",
          createdAt: new Date("2025-05-01T00:00:00.000Z"),
          existingBadgeKeys: ["pioneer", "reviews_1"],
        },
      ],
    });

    expect(candidates).toEqual([
      expect.objectContaining({
        userId: "user-5",
        missingBadgeKeys: [
          "anniversary_7",
          "anniversary_30",
          "anniversary_365",
        ],
      }),
    ]);
  });

  it("returns zero candidates when limit is 0", () => {
    const candidates = buildAnniversaryBackfillCandidates({
      anniversaryBadges,
      limit: 0,
      now,
      users: [
        {
          id: "user-6",
          createdAt: new Date("2025-05-01T00:00:00.000Z"),
          existingBadgeKeys: [],
        },
      ],
    });

    expect(candidates).toEqual([]);
  });
});
