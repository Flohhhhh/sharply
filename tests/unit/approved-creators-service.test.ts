import { beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  getSessionOrThrow: vi.fn(),
}));

const dataMocks = vi.hoisted(() => ({
  fetchApprovedCreatorsData: vi.fn(),
  fetchActiveApprovedCreatorsData: vi.fn(),
  fetchApprovedCreatorByIdData: vi.fn(),
  fetchGearSlugsByCreatorIdData: vi.fn(),
  insertApprovedCreatorData: vi.fn(),
  updateApprovedCreatorData: vi.fn(),
  setApprovedCreatorActiveData: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("~/server/auth", () => authMocks);
vi.mock("~/server/admin/approved-creators/data", () => dataMocks);

import {
  createApprovedCreatorAdmin,
  fetchApprovedCreatorsAdmin,
  setApprovedCreatorActiveAdmin,
} from "~/server/admin/approved-creators/service";

describe("approved creators admin service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.getSessionOrThrow.mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    });
  });

  it("requires admin role to list approved creators", async () => {
    authMocks.getSessionOrThrow.mockResolvedValue({
      user: { id: "editor-1", role: "EDITOR" },
    });

    await expect(fetchApprovedCreatorsAdmin()).rejects.toMatchObject({
      message: "Unauthorized",
      status: 401,
    });
  });

  it("creates approved creators for admins", async () => {
    dataMocks.insertApprovedCreatorData.mockResolvedValue({ id: "creator-1" });

    await expect(
      createApprovedCreatorAdmin({
        name: "Creator Name",
        platform: "YOUTUBE",
        channelUrl: "https://www.youtube.com/@creator",
        avatarUrl: "",
        internalNotes: "",
        isActive: true,
      }),
    ).resolves.toEqual({ id: "creator-1" });

    expect(dataMocks.insertApprovedCreatorData).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Creator Name",
        platform: "YOUTUBE",
        channelUrl: "https://www.youtube.com/@creator",
        isActive: true,
      }),
    );
  });

  it("updates active state for admins", async () => {
    dataMocks.setApprovedCreatorActiveData.mockResolvedValue({
      id: "creator-1",
      isActive: false,
    });

    await expect(
      setApprovedCreatorActiveAdmin({ id: "creator-1", isActive: false }),
    ).resolves.toEqual({
      id: "creator-1",
      isActive: false,
    });
  });
});
