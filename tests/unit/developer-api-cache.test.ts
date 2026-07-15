import { expect, it, vi } from "vitest";

const revalidateTag = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidateTag }));

import { invalidateDeveloperApiCatalogCache } from "~/server/developer-api/cache";

it("expires the developer catalog snapshot immediately", () => {
  invalidateDeveloperApiCatalogCache();

  expect(revalidateTag).toHaveBeenCalledWith("developer-api-catalog", {
    expire: 0,
  });
});
