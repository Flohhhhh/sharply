import { beforeEach, describe, expect, it, vi } from "vitest";

const cacheMocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
}));

const revalidationMocks = vi.hoisted(() => ({
  revalidateGearPages: vi.fn(),
}));

const serviceMocks = vi.hoisted(() => ({
  updateGearPublicationStateService: vi.fn(),
}));

vi.mock("next/cache", () => cacheMocks);
vi.mock("server-only", () => ({}));
vi.mock("~/server/admin/gear/service", () => serviceMocks);
vi.mock("~/server/revalidation", () => revalidationMocks);

import { actionUpdateGearPublicationState } from "~/server/admin/gear/actions";

describe("gear publication state admin action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("revalidates public and admin surfaces after a state change", async () => {
    serviceMocks.updateGearPublicationStateService.mockResolvedValue({
      id: "gear-1",
      slug: "nikon-z9ii",
      publicationState: "RUMORED",
    });

    const result = await actionUpdateGearPublicationState({
      gearId: "gear-1",
      publicationState: "RUMORED",
    });

    expect(result).toMatchObject({
      slug: "nikon-z9ii",
      publicationState: "RUMORED",
    });
    expect(cacheMocks.revalidatePath).toHaveBeenNthCalledWith(1, "/admin/gear");
    expect(cacheMocks.revalidatePath).toHaveBeenNthCalledWith(
      2,
      "/lists/under-construction",
    );
    expect(cacheMocks.revalidatePath).toHaveBeenNthCalledWith(3, "/");
    expect(revalidationMocks.revalidateGearPages).toHaveBeenCalledWith(
      ["nikon-z9ii"],
      { includeBrowse: true },
    );
  });
});
