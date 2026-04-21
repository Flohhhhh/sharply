/*
These tests protect list rules that matter to users: reorder safety, publish safety, and share-link behavior.
They use mocked auth and data functions so we can focus on business rules instead of database setup.
If these fail, it means a key list workflow or URL contract likely regressed.
*/

import { beforeEach,describe,expect,it,vi } from "vitest";

const authHelperMocks = vi.hoisted(() => ({
  getSessionOrThrow: vi.fn(),
}));

const betterAuthMocks = vi.hoisted(() => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

const headerMocks = vi.hoisted(() => ({
  headers: vi.fn(),
}));

const popularityMocks = vi.hoisted(() => ({
  getTrendingStatusForSlugs: vi.fn(),
}));

const dataMocks = vi.hoisted(() => ({
  addGearToListData: vi.fn(),
  createUserListData: vi.fn(),
  deleteUserListData: vi.fn(),
  fetchDefaultListByUserIdData: vi.fn(),
  fetchListByUserAndNameData: vi.fn(),
  fetchListIdsContainingGearForUserData: vi.fn(),
  fetchListItemByIdData: vi.fn(),
  fetchListItemIdsData: vi.fn(),
  fetchListItemsByListIdsData: vi.fn(),
  fetchPublishedUserListsData: vi.fn(),
  fetchSharedListByListIdData: vi.fn(),
  fetchSharedListByPublicIdData: vi.fn(),
  fetchUserListByIdData: vi.fn(),
  fetchUserListsForOwnerData: vi.fn(),
  normalizeListItemPositionsData: vi.fn(),
  removeGearFromListData: vi.fn(),
  removeListItemByIdData: vi.fn(),
  resolveGearIdFromSlugData: vi.fn(),
  unpublishSharedListData: vi.fn(),
  updateListItemPositionsData: vi.fn(),
  updateSharedListSlugData: vi.fn(),
  updateUserListNameData: vi.fn(),
  upsertSharedListData: vi.fn(),
}));

vi.mock("~/server/auth", () => authHelperMocks);
vi.mock("~/auth", () => betterAuthMocks);
vi.mock("next/headers", () => headerMocks);
vi.mock("~/server/popularity/service", () => popularityMocks);
vi.mock("~/server/user-lists/data", () => dataMocks);
vi.mock("server-only", () => ({}));

import {
  fetchPublicSharedListByParam,
  publishUserList,
  reorderUserListItems,
} from "~/server/user-lists/service";

const LIST_ID = "11111111-1111-4111-8111-111111111111";
const ITEM_1 = "22222222-2222-4222-8222-222222222222";
const ITEM_2 = "33333333-3333-4333-8333-333333333333";
const ITEM_3 = "44444444-4444-4444-8444-444444444444";

describe("user list service guardrails", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    authHelperMocks.getSessionOrThrow.mockResolvedValue({
      user: { id: "user-1" },
    });
    betterAuthMocks.auth.api.getSession.mockResolvedValue(null);
    headerMocks.headers.mockResolvedValue(new Headers());

    dataMocks.fetchUserListByIdData.mockResolvedValue({
      id: LIST_ID,
      userId: "user-1",
      name: "My List",
      isDefault: false,
    });
    dataMocks.fetchUserListsForOwnerData.mockResolvedValue([
      {
        id: LIST_ID,
        userId: "user-1",
        name: "My List",
        isDefault: false,
        createdAt: new Date("2026-03-06T00:00:00.000Z"),
        updatedAt: new Date("2026-03-06T00:00:00.000Z"),
        itemCount: 2,
        sharedId: null,
        sharedSlug: null,
        sharedPublicId: null,
        sharedIsPublished: null,
        sharedPublishedAt: null,
        sharedUnpublishedAt: null,
      },
    ]);
    dataMocks.fetchListItemsByListIdsData.mockResolvedValue(
      new Map([[LIST_ID, []]]),
    );
    popularityMocks.getTrendingStatusForSlugs.mockResolvedValue(new Set());
  });

  it("rejects reorder requests when item ids do not match list contents", async () => {
    dataMocks.fetchListItemIdsData.mockResolvedValue([ITEM_1, ITEM_2, ITEM_3]);

    await expect(
      reorderUserListItems({
        listId: LIST_ID,
        orderedItemIds: [ITEM_1, ITEM_2],
      }),
    ).rejects.toMatchObject({ status: 400 });

    expect(dataMocks.updateListItemPositionsData).not.toHaveBeenCalled();
    expect(dataMocks.normalizeListItemPositionsData).not.toHaveBeenCalled();
  });

  it("reorders list items when payload matches exactly", async () => {
    dataMocks.fetchListItemIdsData.mockResolvedValue([ITEM_1, ITEM_2]);

    const result = await reorderUserListItems({
      listId: LIST_ID,
      orderedItemIds: [ITEM_2, ITEM_1],
    });

    expect(result.ok).toBe(true);
    expect(dataMocks.updateListItemPositionsData).toHaveBeenCalledWith(
      LIST_ID,
      [ITEM_2, ITEM_1],
    );
    expect(dataMocks.normalizeListItemPositionsData).toHaveBeenCalledWith(
      LIST_ID,
    );
  });

  it("blocks publishing empty lists", async () => {
    dataMocks.fetchListItemIdsData.mockResolvedValue([]);

    await expect(publishUserList(LIST_ID)).rejects.toMatchObject({ status: 400 });
    expect(dataMocks.upsertSharedListData).not.toHaveBeenCalled();
  });

  it("returns canonical share URL and redirect flag when slug is stale", async () => {
    dataMocks.fetchSharedListByPublicIdData.mockResolvedValue({
      sharedId: "shared-1",
      listId: LIST_ID,
      listName: "My List",
      ownerId: "owner-1",
      ownerHandle: "camfan",
      ownerMemberNumber: 9,
      ownerName: "Cam Fan",
      ownerImage: null,
      slug: "new-slug",
      publicId: "abc12345",
      isPublished: true,
      publishedAt: new Date("2026-03-06T00:00:00.000Z"),
      unpublishedAt: null,
    });
    dataMocks.fetchListItemsByListIdsData.mockResolvedValue(
      new Map([
        [
          LIST_ID,
          [
            {
              id: ITEM_1,
              position: 0,
              gear: {
                id: "gear-1",
                slug: "camera-1",
                name: "Camera 1",
                regionalAliases: null,
                brandName: "Nikon",
                gearType: "CAMERA",
                thumbnailUrl: null,
                releaseDate: null,
                releaseDatePrecision: null,
                announcedDate: null,
                announceDatePrecision: null,
                msrpNowUsdCents: null,
                mpbMaxPriceUsdCents: null,
              },
            },
          ],
        ],
      ]),
    );
    popularityMocks.getTrendingStatusForSlugs.mockResolvedValue(
      new Set(["camera-1"]),
    );

    const payload = await fetchPublicSharedListByParam("old-slug-abc12345");

    expect(payload).not.toBeNull();
    expect(payload?.shouldRedirect).toBe(true);
    expect(payload?.canonicalPath).toBe("/list/new-slug-abc12345");
    expect(payload?.trendingSlugs).toEqual(["camera-1"]);
    expect(popularityMocks.getTrendingStatusForSlugs).toHaveBeenCalledWith(
      ["camera-1"],
      { timeframe: "30d", limit: 20 },
    );
  });

  it("returns null for unknown shared list ids", async () => {
    dataMocks.fetchSharedListByPublicIdData.mockResolvedValue(null);

    const payload = await fetchPublicSharedListByParam("whatever-abc12345");

    expect(payload).toBeNull();
    expect(dataMocks.fetchListItemsByListIdsData).not.toHaveBeenCalled();
  });
});
