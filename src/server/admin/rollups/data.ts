import "server-only";

import { desc } from "drizzle-orm";
import { db } from "~/server/db";
import { rollupRuns } from "~/server/db/schema";

export type RollupRunRow = typeof rollupRuns.$inferSelect;

export async function fetchRollupRunsData(limit = 50): Promise<RollupRunRow[]> {
  return db
    .select()
    .from(rollupRuns)
    .orderBy(desc(rollupRuns.createdAt))
    .limit(limit);
}
