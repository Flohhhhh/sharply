import { hallOfFameItems } from "~/app/(app)/(pages)/lists/hall-of-fame/data";

// Precompute slugs for quick hall of fame membership checks.
const hallOfFameSlugs = new Set(
  hallOfFameItems
    .map((item) => item.slug?.trim())
    .filter((slug): slug is string => Boolean(slug)),
);

export function isInHallOfFame(slug: string | null | undefined): boolean {
  if (!slug) return false;
  return hallOfFameSlugs.has(slug.trim());
}