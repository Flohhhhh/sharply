import "server-only";

import { db } from "~/server/db";
import { brands } from "~/server/db/schema";
import { eq } from "drizzle-orm";

export type BrandRow = { id: string; name: string; slug: string };

export async function fetchBrandBySlugData(
  slug: string,
): Promise<BrandRow | null> {
  const rows = await db
    .select({ id: brands.id, name: brands.name, slug: brands.slug })
    .from(brands)
    .where(eq(brands.slug, slug))
    .limit(1);
  return (rows[0] as BrandRow) ?? null;
}
