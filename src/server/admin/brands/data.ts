import "server-only";

import { asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "~/server/db";
import { brands } from "~/server/db/schema";

export type AdminBrand = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number | null;
};

export type BrandSortOrderUpdate = {
  id: string;
  sortOrder: number | null;
};

export async function fetchAdminBrandsData(): Promise<AdminBrand[]> {
  const rows = await db
    .select({
      id: brands.id,
      name: brands.name,
      slug: brands.slug,
      sortOrder: brands.sortOrder,
    })
    .from(brands)
    .orderBy(sql`${brands.sortOrder} ASC NULLS LAST`, asc(brands.name));
  return rows as AdminBrand[];
}

export async function updateBrandSortOrdersData(params: {
  updates: BrandSortOrderUpdate[];
}) {
  await db.transaction(async (tx) => {
    const updateIds = params.updates.map((update) => update.id);
    const existingRows = await tx
      .select({ id: brands.id })
      .from(brands)
      .where(inArray(brands.id, updateIds));

    if (existingRows.length !== updateIds.length) {
      throw Object.assign(new Error("One or more brands could not be found"), {
        status: 404,
      });
    }

    for (const update of params.updates) {
      await tx
        .update(brands)
        .set({
          sortOrder: update.sortOrder,
          updatedAt: new Date(),
        })
        .where(eq(brands.id, update.id));
    }
  });

  return fetchAdminBrandsData();
}
