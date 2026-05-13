import { beforeEach, describe, expect, it, vi } from "vitest";

type AnniversaryUserFixture = {
  createdAt: Date;
  emailVerified: boolean;
  id: string;
};

const schemaMocks = vi.hoisted(() => ({
  brands: {},
  fixedLensSpecs: {},
  gear: {},
  gearMounts: {},
  lensSpecs: {},
  mounts: {},
  notifications: {},
  ownerships: {},
  reviews: {},
  users: {
    createdAt: Symbol("users.createdAt"),
    emailVerified: Symbol("users.emailVerified"),
    id: Symbol("users.id"),
  },
  wishlists: {},
}));

const dbState = vi.hoisted(() => ({
  now: new Date("2026-05-13T12:00:00.000Z"),
  users: [] as AnniversaryUserFixture[],
}));

const getMonthDayKey = (value: unknown) => {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return null;
  }

  return `${String(value.getUTCMonth() + 1).padStart(2, "0")}-${String(
    value.getUTCDate(),
  ).padStart(2, "0")}`;
};

const dbMocks = vi.hoisted(() => ({
  select: vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn(async (predicate: { values?: unknown[] }) => {
        const fieldReference = predicate.values?.[0];
        const todayKey = getMonthDayKey(dbState.now);

        return dbState.users
          .filter((user) => {
            const candidateValue =
              fieldReference === schemaMocks.users.createdAt
                ? user.createdAt
                : fieldReference === schemaMocks.users.emailVerified
                  ? user.emailVerified
                  : null;

            return getMonthDayKey(candidateValue) === todayKey;
          })
          .map((user) => ({ id: user.id }));
      }),
    })),
  })),
}));

const authMocks = vi.hoisted(() => ({
  auth: {
    api: {
      getSession: vi.fn(),
      updateUser: vi.fn(),
    },
  },
}));

const headerMocks = vi.hoisted(() => ({
  headers: vi.fn(),
}));

const authHelperMocks = vi.hoisted(() => ({
  getSessionOrThrow: vi.fn(),
}));

const userDataMocks = vi.hoisted(() => ({
  updateUserSocialLinks: vi.fn(),
}));

const notificationDataMocks = vi.hoisted(() => ({
  createNotificationData: vi.fn(),
}));

const gearDataMocks = vi.hoisted(() => ({
  fetchGearAliasesByGearIds: vi.fn(),
}));

vi.mock("~/auth", () => authMocks);
vi.mock("next/headers", () => headerMocks);
vi.mock("~/server/auth", () => authHelperMocks);
vi.mock("~/server/db", () => ({ db: dbMocks }));
vi.mock("~/server/db/schema", () => schemaMocks);
vi.mock("~/server/users/data", () => userDataMocks);
vi.mock("~/server/notifications/data", () => notificationDataMocks);
vi.mock("~/server/gear/data", () => gearDataMocks);
vi.mock("server-only", () => ({}));
vi.mock("drizzle-orm", () => ({
  and: vi.fn((...args) => ({ args, type: "and" })),
  eq: vi.fn((left, right) => ({ left, right, type: "eq" })),
  sql: Object.assign(
    vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({
      strings: Array.from(strings),
      type: "sql",
      values,
    })),
    {
      join: vi.fn((values: unknown[], separator: unknown) => ({
        separator,
        type: "sql.join",
        values,
      })),
    },
  ),
}));

import { fetchUsersWithAnniversaryToday } from "~/server/users/service";

describe("fetchUsersWithAnniversaryToday", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbState.now = new Date("2026-05-13T12:00:00.000Z");
    dbState.users = [];
  });

  it("returns users whose createdAt matches today's month/day only", async () => {
    dbState.users = [
      {
        createdAt: new Date("2020-05-13T08:15:00.000Z"),
        emailVerified: false,
        id: "created-at-match",
      },
      {
        createdAt: new Date("2020-05-12T08:15:00.000Z"),
        emailVerified: true,
        id: "email-verified-only",
      },
      {
        createdAt: new Date("2020-05-14T08:15:00.000Z"),
        emailVerified: false,
        id: "different-day",
      },
    ];

    await expect(fetchUsersWithAnniversaryToday()).resolves.toEqual([
      { id: "created-at-match" },
    ]);
  });

  it("does not treat Feb 29 anniversaries as Feb 28 or Mar 1 in non-leap years", async () => {
    dbState.users = [
      {
        createdAt: new Date("2020-02-29T09:00:00.000Z"),
        emailVerified: true,
        id: "leap-day-user",
      },
      {
        createdAt: new Date("2020-02-28T09:00:00.000Z"),
        emailVerified: false,
        id: "feb-28-user",
      },
    ];

    dbState.now = new Date("2025-02-28T12:00:00.000Z");
    await expect(fetchUsersWithAnniversaryToday()).resolves.toEqual([
      { id: "feb-28-user" },
    ]);

    dbState.now = new Date("2025-03-01T12:00:00.000Z");
    await expect(fetchUsersWithAnniversaryToday()).resolves.toEqual([]);
  });

  it("switches matches at UTC midnight based on calendar month/day semantics", async () => {
    dbState.users = [
      {
        createdAt: new Date("2020-05-13T23:59:59.999Z"),
        emailVerified: false,
        id: "before-midnight",
      },
      {
        createdAt: new Date("2020-05-14T00:00:00.000Z"),
        emailVerified: true,
        id: "after-midnight",
      },
    ];

    dbState.now = new Date("2026-05-13T23:59:59.999Z");
    await expect(fetchUsersWithAnniversaryToday()).resolves.toEqual([
      { id: "before-midnight" },
    ]);

    dbState.now = new Date("2026-05-14T00:00:00.000Z");
    await expect(fetchUsersWithAnniversaryToday()).resolves.toEqual([
      { id: "after-midnight" },
    ]);
  });
});
