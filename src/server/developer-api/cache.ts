import "server-only";

import { revalidateTag } from "next/cache";
import { DEVELOPER_API_CATALOG_CACHE_TAG } from "./constants";

/** Invalidates the shared snapshot after a public catalog field changes. */
export function invalidateDeveloperApiCatalogCache() {
  revalidateTag(DEVELOPER_API_CATALOG_CACHE_TAG, { expire: 0 });
}
