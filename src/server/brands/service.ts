import "server-only";

import { fetchBrandBySlugData, type BrandRow } from "./data";

export async function fetchBrandBySlug(slug: string): Promise<BrandRow | null> {
  return fetchBrandBySlugData(slug);
}
