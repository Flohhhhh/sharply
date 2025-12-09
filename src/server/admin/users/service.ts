import "server-only";

import { requireUser, requireRole, type SessionRole } from "~/server/auth";
import { fetchAllUsersData, type AdminUserListItem } from "./data";

export async function fetchAllUsersForAdmin(): Promise<AdminUserListItem[]> {
  const session = await requireUser();
  if (!requireRole(session, ["ADMIN"] as SessionRole[])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  return fetchAllUsersData();
}
