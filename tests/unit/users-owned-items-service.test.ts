import { beforeEach, describe, expect, it, vi } from "vitest";

const authHelperMocks = vi.hoisted(() => ({
  getSessionOrThrow: vi.fn(),
}));

const betterAuthMocks = vi.hoisted(() => ({
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

const dbState = vi.hoisted(() => ({
  selectResults: [] as unknown[],
}));

function buildQueryChain() {
  const chain = {
    from: vi.fn(() => chain),
    innerJoin: vi.fn(() => chain),
    leftJoin: vi.fn(() => chain),
    where: vi.fn(async () => dbState.selectResults.shift() ?? []),
    limit: vi.fn(async () => dbState.selectResults.shift() ?? []),
  };

  return chain;
}

const dbMocks = vi.hoisted(() => ({
  select: vi.fn(() => buildQueryChain()),
}));

const schemaMocks = vi.hoisted(() => ({
  brands: {},
  fixedLensSpecs: {},
  gear: {},
  gearColorways: {},
  gearMounts: {
    gearId: "gearId",
    mountId: "mountId",
  },
  lensSpecs: {},
  mounts: {
    id: "id",
  },
  notifications: {
    id: "id",
    userId: "userId",
    sourceId: "sourceId",
  },
  ownerships: {
    colorwayId: "colorwayId",
    gearId: "gearId",
    userId: "userId",
  },
  reviews: {},
  users: {
    id: "id",
    email: "email",
    emailVerified: "emailVerified",
    handle: "handle",
    image: "image",
    memberNumber: "memberNumber",
    name: "name",
  },
  wishlists: {
    gearId: "gearId",
    userId: "userId",
  },
}));

const userDataMocks = vi.hoisted(() => ({
  updateUserSocialLinks: vi.fn(),
}));

const notificationDataMocks = vi.hoisted(() => ({
  createNotificationData: vi.fn(),
}));

const gearDataMocks = vi.hoisted(() => ({
  fetchGearAliasesByGearIds: vi.fn(),
  fetchGearColorwaysByGearIds: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("~/server/auth", () => authHelperMocks);
vi.mock("~/auth", () => betterAuthMocks);
vi.mock("next/headers", () => headerMocks);
vi.mock("~/server/db", () => ({ db: dbMocks }));
vi.mock("~/server/db/schema", () => schemaMocks);
vi.mock("~/server/users/data", () => userDataMocks);
vi.mock("~/server/notifications/data", () => notificationDataMocks);
vi.mock("~/server/gear/data", () => gearDataMocks);
vi.mock("drizzle-orm", () => ({
  and: vi.fn((...args) => ({ args, type: "and" })),
  eq: vi.fn((left, right) => ({ left, right, type: "eq" })),
  sql: Object.assign(
    vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({
      strings,
      values,
      type: "sql",
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

import {
  fetchOwnedGearItemForUser,
  fetchUserOwnedItems,
} from "~/server/users/service";

describe("owned item read model", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbState.selectResults = [];
    gearDataMocks.fetchGearAliasesByGearIds.mockResolvedValue(new Map());
    gearDataMocks.fetchGearColorwaysByGearIds.mockResolvedValue(new Map());
  });

  it("uses the selected front-view colorway as the collection thumbnail", async () => {
    dbState.selectResults.push(
      [
        {
          ownerships: { colorwayId: "cw-1" },
          gear: {
            id: "gear-1",
            brandId: "brand-1",
            mountId: null,
            name: "Nikon Zf",
            slug: "nikon-zf",
            gearType: "CAMERA",
            thumbnailUrl: "https://cdn.example.com/default-front.webp",
          },
          brands: null,
          lens_specs: null,
          fixed_lens_specs: null,
        },
      ],
      [],
    );
    gearDataMocks.fetchGearColorwaysByGearIds.mockResolvedValue(
      new Map([
        [
          "gear-1",
          [
            {
              id: "cw-1",
              gearId: "gear-1",
              name: "Silver",
              slug: "silver",
              swatchColorA: "#DDDDDD",
              swatchColorB: "#999999",
              sortOrder: 0,
              frontImageUrl: "https://cdn.example.com/silver-front.webp",
              topViewUrl: null,
              rearViewUrl: null,
              createdAt: new Date("2026-01-01T00:00:00Z"),
              updatedAt: new Date("2026-01-01T00:00:00Z"),
            },
          ],
        ],
      ]),
    );

    const result = await fetchUserOwnedItems("user-1");

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "gear-1",
      thumbnailUrl: "https://cdn.example.com/silver-front.webp",
      selectedColorwayId: "cw-1",
    });
    expect(result[0]?.colorways).toHaveLength(1);
  });

  it("falls back to the base thumbnail when the saved selection is stale or lacks a front view", async () => {
    dbState.selectResults.push(
      [
        {
          ownerships: { colorwayId: "cw-stale" },
          gear: {
            id: "gear-1",
            brandId: "brand-1",
            mountId: null,
            name: "Nikon Zf",
            slug: "nikon-zf",
            gearType: "CAMERA",
            thumbnailUrl: "https://cdn.example.com/default-front.webp",
          },
          brands: null,
          lens_specs: null,
          fixed_lens_specs: null,
        },
      ],
      [],
      [
        {
          ownerships: { colorwayId: "cw-top-only" },
          gear: {
            id: "gear-1",
            brandId: "brand-1",
            mountId: null,
            name: "Nikon Zf",
            slug: "nikon-zf",
            gearType: "CAMERA",
            thumbnailUrl: "https://cdn.example.com/default-front.webp",
          },
          brands: null,
          lens_specs: null,
          fixed_lens_specs: null,
        },
      ],
      [],
    );
    gearDataMocks.fetchGearColorwaysByGearIds
      .mockResolvedValueOnce(
        new Map([
          [
            "gear-1",
            [
              {
                id: "cw-1",
                gearId: "gear-1",
                name: "Silver",
                slug: "silver",
                swatchColorA: "#DDDDDD",
                swatchColorB: "#999999",
                sortOrder: 0,
                frontImageUrl: "https://cdn.example.com/silver-front.webp",
                topViewUrl: null,
                rearViewUrl: null,
                createdAt: new Date("2026-01-01T00:00:00Z"),
                updatedAt: new Date("2026-01-01T00:00:00Z"),
              },
            ],
          ],
        ]),
      )
      .mockResolvedValueOnce(
        new Map([
          [
            "gear-1",
            [
              {
                id: "cw-top-only",
                gearId: "gear-1",
                name: "Black",
                slug: "black",
                swatchColorA: "#111111",
                swatchColorB: "#333333",
                sortOrder: 1,
                frontImageUrl: null,
                topViewUrl: "https://cdn.example.com/black-top.webp",
                rearViewUrl: null,
                createdAt: new Date("2026-01-01T00:00:00Z"),
                updatedAt: new Date("2026-01-01T00:00:00Z"),
              },
            ],
          ],
        ]),
      );

    const staleSelection = await fetchOwnedGearItemForUser("user-1", "gear-1");
    const topOnlySelection = await fetchOwnedGearItemForUser("user-1", "gear-1");

    expect(staleSelection).toMatchObject({
      thumbnailUrl: "https://cdn.example.com/default-front.webp",
      selectedColorwayId: "cw-stale",
    });
    expect(topOnlySelection).toMatchObject({
      thumbnailUrl: "https://cdn.example.com/default-front.webp",
      selectedColorwayId: "cw-top-only",
    });
  });
});
