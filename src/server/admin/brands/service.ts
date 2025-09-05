import "server-only";

import { requireUser, requireRole, type SessionRole } from "~/server/auth";
import { fetchAdminBrandsData, type AdminBrand } from "./data";

export async function fetchAdminBrands(): Promise<AdminBrand[]> {
  const session = await requireUser();
  if (!requireRole(session, ["ADMIN", "EDITOR"] as SessionRole[])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  return fetchAdminBrandsData();
}
