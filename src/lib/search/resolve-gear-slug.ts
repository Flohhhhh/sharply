/** Prefer explicit slug; otherwise parse `/gear/{slug}` from suggest-api href. */
export function resolveGearSlugFromSuggestion(row: {
  slug?: string | null;
  href?: string | null;
}): string {
  const explicit = typeof row.slug === "string" ? row.slug.trim() : "";
  if (explicit) return explicit;

  const href = typeof row.href === "string" ? row.href.trim() : "";
  const match = href.match(/^\/gear\/([^/?#]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : "";
}
