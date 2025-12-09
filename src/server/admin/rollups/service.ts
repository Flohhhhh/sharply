import "server-only";

import { requireUser, requireRole, type UserRole } from "~/server/auth";
import { fetchRollupRunsData, type RollupRunRow } from "./data";

export async function fetchRollupRuns(limit = 50): Promise<RollupRunRow[]> {
  const session = await requireUser();
  if (!requireRole(session, ["ADMIN", "EDITOR"] as UserRole[])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  return fetchRollupRunsData(limit);
}
