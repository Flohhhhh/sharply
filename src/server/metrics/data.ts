import "server-only";

import { eq, sql } from "drizzle-orm";
import { GEAR_PUBLICATION_STATES } from "~/lib/gear/publication-state";
import { db } from "~/server/db";
import { gear, gearEdits, reviews } from "~/server/db/schema";

/** Count all gear items */
export async function getGearCount(): Promise<number> {
  const row = await db
    .select({ c: sql<number>`count(*)` })
    .from(gear)
    .where(eq(gear.publicationState, GEAR_PUBLICATION_STATES.PUBLISHED));
  return Number(row[0]?.c ?? 0);
}

/** Count published gear items for each brand. */
export async function getPublishedGearCountsByBrand(): Promise<
  Array<{ brandId: string; count: number }>
> {
  const rows = await db
    .select({
      brandId: gear.brandId,
      count: sql<number>`count(*)`,
    })
    .from(gear)
    .where(eq(gear.publicationState, GEAR_PUBLICATION_STATES.PUBLISHED))
    .groupBy(gear.brandId);

  return rows.flatMap((row) =>
    row.brandId ? [{ brandId: row.brandId, count: Number(row.count) }] : [],
  );
}

/** Total contributions = count(gearEdits) + count(reviews) */
export async function getContributionCount(): Promise<number> {
  const [edits, revs] = await Promise.all([
    db.select({ c: sql<number>`count(*)` }).from(gearEdits),
    db.select({ c: sql<number>`count(*)` }).from(reviews),
  ]);
  return Number(edits[0]?.c ?? 0) + Number(revs[0]?.c ?? 0);
}
