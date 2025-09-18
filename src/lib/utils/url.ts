export type StringParamValue = string | number | undefined | null;

export function toStringValue(value: StringParamValue): string | undefined {
  if (value === undefined || value === null) return undefined;
  return String(value);
}

export function buildSearchHref(
  pathname: string,
  params: Record<string, StringParamValue | StringParamValue[]>,
): string {
  const search = new URLSearchParams();
  for (const [key, raw] of Object.entries(params)) {
    if (Array.isArray(raw)) {
      for (const v of raw) {
        const sv = toStringValue(v);
        if (sv && sv.length > 0) search.append(key, sv);
      }
    } else {
      const sv = toStringValue(raw);
      if (sv && sv.length > 0) search.set(key, sv);
    }
  }
  const qs = search.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function mergeSearchParams(
  existing: URLSearchParams,
  updates: Record<string, StringParamValue | StringParamValue[]>,
): string {
  const next = new URLSearchParams(existing);
  for (const [key, value] of Object.entries(updates)) {
    if (Array.isArray(value)) {
      next.delete(key);
      for (const v of value) {
        const sv = toStringValue(v);
        if (sv && sv.length > 0) next.append(key, sv);
      }
    } else {
      const sv = toStringValue(value);
      if (!sv || sv.length === 0) next.delete(key);
      else next.set(key, sv);
    }
  }
  return next.toString();
}

/**
 * buildCompareHref
 *
 * Builds a canonical compare URL using exact gear slugs. Slugs are sorted
 * alphabetically to ensure a stable URL for the same pair.
 */
export function buildCompareHref(slugs: string[]): string {
  const unique = Array.from(new Set(slugs.filter(Boolean)));
  if (unique.length === 0) return "/compare";
  const sorted = [...unique].sort((a, b) => a.localeCompare(b));
  return buildSearchHref("/compare", { i: sorted });
}
