import "server-only";

import { sql } from "drizzle-orm";
import { db } from "~/server/db";
import { gear, reviews, gearEdits } from "~/server/db/schema";

/** Count all gear items */
export async function getGearCount(): Promise<number> {
  const row = await db.select({ c: sql<number>`count(*)` }).from(gear);
  return Number(row[0]?.c ?? 0);
}

/** Total contributions = count(gearEdits) + count(reviews) */
export async function getContributionCount(): Promise<number> {
  const [edits, revs] = await Promise.all([
    db.select({ c: sql<number>`count(*)` }).from(gearEdits),
    db.select({ c: sql<number>`count(*)` }).from(reviews),
  ]);
  return Number(edits[0]?.c ?? 0) + Number(revs[0]?.c ?? 0);
}
