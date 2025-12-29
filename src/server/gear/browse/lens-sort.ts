import { sql } from "drizzle-orm";

import { LENS_FOCAL_LENGTH_SORT } from "~/lib/browse/sort-constants";
import { lensSpecs } from "~/server/db/schema";

export { LENS_FOCAL_LENGTH_SORT };

// Fallback ensures lenses missing focal data sink to the end of the list.
const LENS_FOCAL_SORT_NULL_RANK = 999_999;

export function lensFocalLengthSortExpression() {
  return sql`coalesce(${lensSpecs.focalLengthMinMm}, ${lensSpecs.focalLengthMaxMm}, ${LENS_FOCAL_SORT_NULL_RANK})`;
}

export function lensFocalLengthSortFallback() {
  return LENS_FOCAL_SORT_NULL_RANK;
}

