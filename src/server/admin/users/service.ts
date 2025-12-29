import "server-only";

import { requireRole } from "~/lib/auth/auth-helpers";
import { getSessionOrThrow } from "~/server/auth";

import { fetchAllUsersData, type AdminUserListItem } from "./data";

export async function fetchAllUsersForAdmin(): Promise<AdminUserListItem[]> {
  const session = await getSessionOrThrow();
  if (!requireRole(session?.user, ["ADMIN"])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  return fetchAllUsersData();
}
