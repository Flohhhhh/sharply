import { beforeEach, describe, expect, it, vi } from "vitest";

process.env.DATABASE_URL ??=
  "postgres://postgres:postgres@localhost:5432/sharply";
process.env.PAYLOAD_SECRET ??= "test-payload-secret";
process.env.NEXT_PUBLIC_BASE_URL ??= "http://localhost:3000";

const authMocks = vi.hoisted(() => ({
  getSessionOrThrow: vi.fn(),
}));

const gearDataMocks = vi.hoisted(() => ({
  fetchGearColorwaysByGearId: vi.fn(),
  isOwned: vi.fn(),
  updateOwnershipColorway: vi.fn(),
}));

const ownedItemMocks = vi.hoisted(() => ({
  fetchOwnedGearItemForUser: vi.fn(),
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
vi.mock("~/server/auth", () => authMocks);
vi.mock("~/server/gear/data", () => gearDataMocks);
vi.mock("~/server/users/service", () => ownedItemMocks);

import { updateOwnedGearColorway } from "~/server/gear/service";

describe("updateOwnedGearColorway", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.getSessionOrThrow.mockResolvedValue({
      user: { id: "user-1" },
    });
    gearDataMocks.isOwned.mockResolvedValue(true);
    gearDataMocks.updateOwnershipColorway.mockResolvedValue({
      gearId: "gear-1",
      userId: "user-1",
      colorwayId: "cw-1",
    });
    ownedItemMocks.fetchOwnedGearItemForUser.mockResolvedValue({
      id: "gear-1",
      thumbnailUrl: "https://cdn.example.com/silver-front.webp",
      selectedColorwayId: "cw-1",
    });
  });

  it("accepts a valid front-view colorway for an owned gear item", async () => {
    gearDataMocks.fetchGearColorwaysByGearId.mockResolvedValue([
      {
        id: "cw-1",
        frontImageUrl: "https://cdn.example.com/silver-front.webp",
      },
    ]);

    const result = await updateOwnedGearColorway({
      gearId: "gear-1",
      colorwayId: "cw-1",
    });

    expect(gearDataMocks.fetchGearColorwaysByGearId).toHaveBeenCalledWith(
      "gear-1",
    );
    expect(gearDataMocks.updateOwnershipColorway).toHaveBeenCalledWith({
      gearId: "gear-1",
      userId: "user-1",
      colorwayId: "cw-1",
    });
    expect(result).toEqual({
      item: {
        id: "gear-1",
        thumbnailUrl: "https://cdn.example.com/silver-front.webp",
        selectedColorwayId: "cw-1",
      },
    });
  });

  it("rejects colorways that do not belong to the owned gear", async () => {
    gearDataMocks.fetchGearColorwaysByGearId.mockResolvedValue([
      {
        id: "cw-2",
        frontImageUrl: "https://cdn.example.com/black-front.webp",
      },
    ]);

    await expect(
      updateOwnedGearColorway({
        gearId: "gear-1",
        colorwayId: "cw-1",
      }),
    ).rejects.toMatchObject({
      message: "INVALID_OWNERSHIP_COLORWAY",
      status: 400,
    });

    expect(gearDataMocks.updateOwnershipColorway).not.toHaveBeenCalled();
  });

  it("rejects colorways without a front view image", async () => {
    gearDataMocks.fetchGearColorwaysByGearId.mockResolvedValue([
      {
        id: "cw-1",
        frontImageUrl: null,
      },
    ]);

    await expect(
      updateOwnedGearColorway({
        gearId: "gear-1",
        colorwayId: "cw-1",
      }),
    ).rejects.toMatchObject({
      message: "OWNERSHIP_COLORWAY_FRONT_IMAGE_REQUIRED",
      status: 400,
    });

    expect(gearDataMocks.updateOwnershipColorway).not.toHaveBeenCalled();
  });

  it("rejects updates when the ownership row no longer exists", async () => {
    gearDataMocks.isOwned.mockResolvedValue(true);
    gearDataMocks.updateOwnershipColorway.mockResolvedValue(null);

    await expect(
      updateOwnedGearColorway({
        gearId: "gear-1",
        colorwayId: null,
      }),
    ).rejects.toMatchObject({
      message: "OWNERSHIP_NOT_FOUND",
      status: 404,
    });

    expect(ownedItemMocks.fetchOwnedGearItemForUser).not.toHaveBeenCalled();
  });

  it("allows clearing the ownership colorway selection", async () => {
    ownedItemMocks.fetchOwnedGearItemForUser.mockResolvedValue({
      id: "gear-1",
      thumbnailUrl: "https://cdn.example.com/default-front.webp",
      selectedColorwayId: null,
    });

    const result = await updateOwnedGearColorway({
      gearId: "gear-1",
      colorwayId: null,
    });

    expect(gearDataMocks.fetchGearColorwaysByGearId).not.toHaveBeenCalled();
    expect(gearDataMocks.updateOwnershipColorway).toHaveBeenCalledWith({
      gearId: "gear-1",
      userId: "user-1",
      colorwayId: null,
    });
    expect(result).toEqual({
      item: {
        id: "gear-1",
        thumbnailUrl: "https://cdn.example.com/default-front.webp",
        selectedColorwayId: null,
      },
    });
  });
});
