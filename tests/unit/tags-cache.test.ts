import { expect, it, vi } from "vitest";

const revalidateTag = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidateTag }));

import { invalidatePublicTagOptionsCache } from "~/server/tags/cache";

it("expires public tag options immediately", () => {
  invalidatePublicTagOptionsCache();

  expect(revalidateTag).toHaveBeenCalledWith("public-tag-options", {
    expire: 0,
  });
});
