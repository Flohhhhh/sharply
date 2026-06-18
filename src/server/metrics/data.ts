import "server-only";

import { eq,sql } from "drizzle-orm";
import { GEAR_PUBLICATION_STATES } from "~/lib/gear/publication-state";
import { db } from "~/server/db";
import { gear,gearEdits,reviews } from "~/server/db/schema";

/** Count all gear items */
export async function getGearCount(): Promise<number> {
  const row = await db
    .select({ c: sql<number>`count(*)` })
    .from(gear)
    .where(eq(gear.publicationState, GEAR_PUBLICATION_STATES.PUBLISHED));
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
