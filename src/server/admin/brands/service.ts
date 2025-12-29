import "server-only";

import { fetchAdminBrandsData, type AdminBrand } from "./data";
import { getSessionOrThrow } from "~/server/auth";

export async function fetchAdminBrands(): Promise<AdminBrand[]> {
  const session = await getSessionOrThrow();
  if (!session.user)
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  return fetchAdminBrandsData();
}
