import "server-only";

import { db } from "~/server/db";
import { brands } from "~/server/db/schema";

export type AdminBrand = { id: string; name: string };

export async function fetchAdminBrandsData(): Promise<AdminBrand[]> {
  const rows = await db
    .select({ id: brands.id, name: brands.name })
    .from(brands);
  return rows as unknown as AdminBrand[];
}
