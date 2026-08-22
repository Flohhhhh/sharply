import { sql } from "drizzle-orm";
import { gear } from "~/server/db/schema";

/**
 * SQL projection for public gear-card images.
 *
 * Keep the database's raw thumbnailUrl untouched on Gear/GearItem reads. This
 * projection is only for public display lists where lenses may use their
 * orthographic image as a fallback.
 */
export function getGearDisplayImageSql() {
  return sql<string | null>`CASE
    WHEN ${gear.gearType} = 'LENS'
      THEN COALESCE(NULLIF(${gear.thumbnailUrl}, ''), NULLIF(${gear.topViewUrl}, ''))
    ELSE ${gear.thumbnailUrl}
  END`;
}
