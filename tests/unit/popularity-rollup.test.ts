import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/env", () => ({ env: {} }));
vi.mock("~/server/db", () => ({ db: {} }));
vi.mock("~/server/db/schema", () => ({ rollupRuns: {} }));

import { revalidatePopularityCachesAfterRollup } from "~/server/popularity/rollup";

describe("popularity rollup cache invalidation", () => {
  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  it("revalidates the baseline cache and lets the live cache expire naturally", async () => {
    const revalidateTag = vi.fn();

    await revalidatePopularityCachesAfterRollup(revalidateTag);

    expect(revalidateTag).toHaveBeenCalledTimes(1);
    expect(revalidateTag).toHaveBeenCalledWith("trending", "max");
    expect(revalidateTag).not.toHaveBeenCalledWith("trending-live", "max");
  });
});
