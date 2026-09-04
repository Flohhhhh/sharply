export type TagSlugOption = { slug: string };

export function normalizeTagSlugs(
  values: readonly string[],
  options: readonly TagSlugOption[],
): string[] {
  const listedSlugs = new Set(options.map((option) => option.slug));
  const normalized = new Set<string>();

  for (const value of values) {
    const slug = value.trim();
    if (slug && listedSlugs.has(slug)) normalized.add(slug);
  }

  return Array.from(normalized);
}
