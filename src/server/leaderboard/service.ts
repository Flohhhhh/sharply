import "server-only";

import { requireRole } from "~/lib/auth/auth-helpers";
import { getSessionOrThrow } from "~/server/auth";
import type { UserRole } from "~/auth";
import { fetchContributorLeaderboardData } from "./data";

export async function fetchContributorLeaderboard(limit = 10) {
  // Ensure only EDITOR/ADMIN/SUPERADMIN can access admin dashboard pages; mirror admin layout behavior
  const session = await getSessionOrThrow();
  if (!requireRole(session?.user, ["ADMIN", "EDITOR", "SUPERADMIN"])) {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }

  return fetchContributorLeaderboardData(limit);
}
