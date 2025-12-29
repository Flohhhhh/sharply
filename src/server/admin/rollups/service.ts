import "server-only";

import { requireRole } from "~/lib/auth/auth-helpers";
import { getSessionOrThrow } from "~/server/auth";

import { fetchRollupRunsData, type RollupRunRow } from "./data";

export async function fetchRollupRuns(limit = 50): Promise<RollupRunRow[]> {
  const session = await getSessionOrThrow();
  if (!requireRole(session?.user, ["EDITOR"])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  return fetchRollupRunsData(limit);
}
