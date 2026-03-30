import { beforeEach, describe, expect, it, vi } from "vitest";

const cacheMocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
}));

const authMocks = vi.hoisted(() => ({
  getSessionOrThrow: vi.fn(),
}));

vi.mock("next/cache", () => cacheMocks);
vi.mock("server-only", () => ({}));
vi.mock("~/server/auth", () => authMocks);

import { actionRevalidateGearPage } from "~/server/admin/tools/actions";

describe("admin tools actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("revalidates the selected gear page for admins", async () => {
    authMocks.getSessionOrThrow.mockResolvedValue({
      user: { id: "user-1", role: "ADMIN" },
    });

    const result = await actionRevalidateGearPage({ gearSlug: "nikon-fm2" });

    expect(result).toEqual({ ok: true, path: "/gear/nikon-fm2" });
    expect(cacheMocks.revalidatePath).toHaveBeenCalledWith("/gear/nikon-fm2");
  });

  it("rejects non-admin users", async () => {
    authMocks.getSessionOrThrow.mockResolvedValue({
      user: { id: "user-1", role: "USER" },
    });

    await expect(
      actionRevalidateGearPage({ gearSlug: "nikon-fm2" }),
    ).rejects.toMatchObject({ message: "Unauthorized", status: 401 });
    expect(cacheMocks.revalidatePath).not.toHaveBeenCalled();
  });
});
