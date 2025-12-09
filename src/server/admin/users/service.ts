import "server-only";

import { requireUser, requireRole, type UserRole } from "~/server/auth";
import { fetchAllUsersData, type AdminUserListItem } from "./data";

export async function fetchAllUsersForAdmin(): Promise<AdminUserListItem[]> {
  const session = await requireUser();
  if (!requireRole(session, ["ADMIN"] as UserRole[])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  return fetchAllUsersData();
}
