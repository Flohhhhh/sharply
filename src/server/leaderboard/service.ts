import "server-only";

import { auth, requireUser } from "~/server/auth";
import { fetchContributorLeaderboardData } from "./data";

export async function fetchContributorLeaderboard(limit = 10) {
  // Ensure only EDITOR/ADMIN can access admin dashboard pages; mirror admin layout behavior
  const session = await auth();
  if (!session?.user) {
    throw Object.assign(new Error("Unauthenticated"), { status: 401 });
  }
  const role = (session.user as any).role as string | undefined;
  if (!role || !["ADMIN", "EDITOR"].includes(role)) {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }

  return fetchContributorLeaderboardData(limit);
}
