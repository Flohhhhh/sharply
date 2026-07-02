import { beforeEach, describe, expect, it, vi } from "vitest";

const cacheMocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
}));

const serviceMocks = vi.hoisted(() => ({
  updateBrandSortOrdersService: vi.fn(),
}));

vi.mock("next/cache", () => cacheMocks);
vi.mock("server-only", () => ({}));
vi.mock("~/server/admin/brands/service", () => serviceMocks);

import { actionUpdateBrandSortOrders } from "~/server/admin/brands/actions";

describe("admin brands actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serviceMocks.updateBrandSortOrdersService.mockResolvedValue([
      { id: "brand-1", name: "Canon", slug: "canon", sortOrder: 1 },
    ]);
  });

  it("revalidates the tools page after updating brand sort order", async () => {
    const result = await actionUpdateBrandSortOrders({
      updates: [{ id: "brand-1", sortOrder: 1 }],
    });

    expect(result).toEqual([
      { id: "brand-1", name: "Canon", slug: "canon", sortOrder: 1 },
    ]);
    expect(cacheMocks.revalidatePath).toHaveBeenCalledWith("/admin/tools");
  });
});
