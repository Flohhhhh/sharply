export function normalizeSearchQuery(query: string): string {
  return query.toLowerCase().trim();
}

export function normalizeSearchQueryNoPunct(query: string): string {
  return normalizeSearchQuery(query).replace(/[\s\-_.\/]+/g, "");
}

export function getSignificantNumericTokens(query: string): string[] {
  const normalizedQuery = normalizeSearchQuery(query);
  const numericMatches = Array.from(normalizedQuery.matchAll(/\d+(?:\.\d+)?/g));

  return numericMatches
    .map((match) => match[0])
    .filter((token) => token.includes(".") || token.length >= 3);
}

export function buildDecimalNumericTokenRegex(token: string): string | null {
  if (!token.includes(".")) return null;

  const digitGroups = token
    .split(".")
    .map((part) => part.replace(/\D+/g, ""))
    .filter(Boolean);

  if (digitGroups.length < 2) return null;

  return `(^|[^0-9])${digitGroups.join("[^0-9]+")}([^0-9]|$)`;
}
