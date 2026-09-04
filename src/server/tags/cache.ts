import "server-only";

import { revalidateTag } from "next/cache";
import { PUBLIC_TAG_OPTIONS_CACHE_TAG } from "./constants";

export function invalidatePublicTagOptionsCache() {
  revalidateTag(PUBLIC_TAG_OPTIONS_CACHE_TAG, { expire: 0 });
}
