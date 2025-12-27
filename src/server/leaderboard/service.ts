import "server-only";

import { requireUser, requireRole, type UserRole } from "~/server/auth";
import { fetchContributorLeaderboardData } from "./data";

export async function fetchContributorLeaderboard(limit = 10) {
  // Ensure only EDITOR/ADMIN/SUPERADMIN can access admin dashboard pages; mirror admin layout behavior
  const session = await requireUser();
  if (!requireRole(session, ["ADMIN", "EDITOR"] as UserRole[])) {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }

  return fetchContributorLeaderboardData(limit);
}
