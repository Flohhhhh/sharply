export function getEmptySearchSubmitHref(query: string): string | undefined {
  return query.trim().length === 0 ? "/search" : undefined;
}
