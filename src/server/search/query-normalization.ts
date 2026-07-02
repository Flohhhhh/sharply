// Query parsing configuration for lens-oriented shorthand that we intentionally
// treat as high-signal only in the right context.
const LENS_FEATURE_ACRONYM_ALLOWLIST = [
  "pf",
  "vr",
  "is",
  "oss",
  "ois",
  "vc",
  "os",
  "stm",
  "usm",
  "hsm",
  "ssm",
] as const;

const LENS_FEATURE_ACRONYM_SET = new Set<string>(
  LENS_FEATURE_ACRONYM_ALLOWLIST,
);

const APERTURE_TOKEN_RE = /(?:\bf\s*\/?\s*|\bt\s*\/?\s*)(\d+(?:\.\d+)?)/gi;
const FOCAL_LENGTH_TOKEN_RE = /(\d+(?:\.\d+)?)\s*mm\b/gi;

// These weights are mirrored by the SQL relevance builder in data.ts.
export const SEARCH_RANKING_WEIGHTS = {
  rawContains: 2.4,
  normalizedContains: 1.9,
  brandAgnosticContains: 1.2,
  relaxedContains: 0.8,
  strongToken: 0.35,
  featureAcronymToken: 0.7,
  focalToken: 1.0,
  apertureToken: 0.65,
  primarySingleFocal: 1.2,
  singleFocalZoomPenalty: 0.95,
  similarityNormalizedNoBrand: 0.35,
  similarityNormalizedCol: 0.2,
  similaritySearchName: 0.12,
} as const;

export type SearchQueryTokens = {
  normalizedQuery: string;
  normalizedQueryNoPunct: string;
  parts: string[];
  strongTextTokens: string[];
  significantNumericTokens: string[];
  apertureTokens: string[];
  focalLengthTokens: string[];
  rawLensFeatureAcronymTokens: string[];
  activeLensFeatureAcronymTokens: string[];
  hasLensEvidence: boolean;
  isLowInformationFeatureAcronymQuery: boolean;
};

// Base normalization
export function normalizeSearchQuery(query: string): string {
  return query.toLowerCase().trim();
}

export function normalizeSearchQueryNoPunct(query: string): string {
  return normalizeSearchQuery(query).replace(/[\s\-_.\/]+/g, "");
}

// Query token extraction
function uniqueTokens(tokens: string[]): string[] {
  return Array.from(new Set(tokens));
}

function splitSearchQueryParts(query: string): string[] {
  return normalizeSearchQuery(query)
    .split(/[\s_]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function normalizeTokenPart(part: string): string {
  return part.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "");
}

function isApertureShapedPart(part: string): boolean {
  return /^(?:f|t)\s*\/?\s*\d/.test(part);
}

function isLensFeatureAcronymToken(part: string): boolean {
  return LENS_FEATURE_ACRONYM_SET.has(part);
}

export function getStrongTextTokens(query: string): string[] {
  return uniqueTokens(
    splitSearchQueryParts(query)
      .map(normalizeTokenPart)
      .filter(
        (part) =>
          /[a-z]/i.test(part) &&
          part.length >= 3 &&
          !isLensFeatureAcronymToken(part) &&
          !isApertureShapedPart(part),
      ),
  );
}

export function getSignificantNumericTokens(query: string): string[] {
  const normalizedQuery = normalizeSearchQuery(query);
  const numericMatches = Array.from(normalizedQuery.matchAll(/\d+(?:\.\d+)?/g));

  return uniqueTokens(
    numericMatches
      .map((match) => match[0])
      .filter((token) => token.includes(".") || token.length >= 3),
  );
}

export function getLensFeatureAcronymTokens(query: string): string[] {
  return uniqueTokens(
    splitSearchQueryParts(query)
      .map(normalizeTokenPart)
      .filter((part) => isLensFeatureAcronymToken(part)),
  );
}

export function getApertureTokens(query: string): string[] {
  return uniqueTokens(
    Array.from(normalizeSearchQuery(query).matchAll(APERTURE_TOKEN_RE))
      .map((match) => match[1]?.trim() ?? "")
      .filter(Boolean),
  );
}

export function getExplicitFocalLengthTokens(query: string): string[] {
  return uniqueTokens(
    Array.from(normalizeSearchQuery(query).matchAll(FOCAL_LENGTH_TOKEN_RE))
      .map((match) => match[1]?.trim() ?? "")
      .filter(Boolean),
  );
}

export function parseSearchQueryTokens(query: string): SearchQueryTokens {
  const normalizedQuery = normalizeSearchQuery(query);
  const normalizedQueryNoPunct = normalizeSearchQueryNoPunct(query);
  const parts = splitSearchQueryParts(query);
  const strongTextTokens = getStrongTextTokens(query);
  const significantNumericTokens = getSignificantNumericTokens(query);
  const apertureTokens = getApertureTokens(query);
  const explicitFocalLengthTokens = getExplicitFocalLengthTokens(query);
  const rawLensFeatureAcronymTokens = getLensFeatureAcronymTokens(query);
  const hasContextForLensFeatureAcronyms =
    significantNumericTokens.length > 0 || strongTextTokens.length > 0;
  // Keep track of raw acronym detection separately from the "active" list.
  // Example: a bare query like "is" should still be recognized as an acronym
  // token, but we do not want to treat it like a strong lens feature signal
  // unless the rest of the query already looks lens-like.
  const activeLensFeatureAcronymTokens = hasContextForLensFeatureAcronyms
    ? rawLensFeatureAcronymTokens
    : [];
  const focalLengthTokens =
    explicitFocalLengthTokens.length > 0
      ? explicitFocalLengthTokens
      : significantNumericTokens.filter((token) => !token.includes("."));

  return {
    normalizedQuery,
    normalizedQueryNoPunct,
    parts,
    strongTextTokens,
    significantNumericTokens,
    apertureTokens,
    focalLengthTokens,
    rawLensFeatureAcronymTokens,
    activeLensFeatureAcronymTokens,
    hasLensEvidence:
      explicitFocalLengthTokens.length > 0 ||
      apertureTokens.length > 0 ||
      hasContextForLensFeatureAcronyms,
    isLowInformationFeatureAcronymQuery:
      rawLensFeatureAcronymTokens.length > 0 &&
      activeLensFeatureAcronymTokens.length === 0 &&
      strongTextTokens.length === 0 &&
      significantNumericTokens.length === 0 &&
      apertureTokens.length === 0,
  };
}

// Regex builders used by the SQL search layer and pure ranking tests.
export function buildDecimalNumericTokenRegex(token: string): string | null {
  if (!token.includes(".")) return null;

  const digitGroups = token
    .split(".")
    .map((part) => part.replace(/\D+/g, ""))
    .filter(Boolean);

  if (digitGroups.length < 2) return null;

  return `(^|[^0-9])${digitGroups.join("[^0-9]+")}([^0-9]|$)`;
}

function escapeRegexValue(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildWholeWordTokenRegex(token: string): string {
  return `(^|[^a-z0-9])${escapeRegexValue(token)}([^a-z0-9]|$)`;
}

export function buildFocalLengthTokenRegex(token: string): string {
  return `(^|[^0-9])${escapeRegexValue(token)}\\s*mm([^0-9]|$)`;
}

export function buildApertureTokenRegex(token: string): string {
  const decimalPattern =
    buildDecimalNumericTokenRegex(token) ??
    `(^|[^0-9])${escapeRegexValue(token)}([^0-9]|$)`;
  const innerPattern = decimalPattern
    .replace(/^\(\^\|\[\^0-9\]\)/, "")
    .replace(/\(\[\^0-9\]\|\$\)$/, "");

  return `(^|[^a-z0-9])[ft][^0-9]{0,3}${innerPattern}[a-z]?([^a-z0-9]|$)`;
}

export function buildSingleFocalZoomOvermatchRegex(token: string): string {
  return `(^|[^0-9])\\d+[^0-9]+${escapeRegexValue(token)}\\s*mm([^0-9]|$)`;
}

// Comparable text normalization for test-side ranking.
function normalizeComparableText(value: string): string {
  return normalizeSearchQuery(value).replace(/[\s\-_.\/]+/g, "");
}

function stripBrandPrefixForComparison(params: {
  value: string;
  brandName?: string | null;
}): string {
  const { value, brandName } = params;
  const searchLower = normalizeSearchQuery(value);
  const brandLower = normalizeSearchQuery(brandName ?? "");
  const withoutBrand = brandLower ? searchLower.replace(brandLower, "") : searchLower;

  return brandLower === "nikon"
    ? withoutBrand.replace(/^\s*nikkor\s+/g, "")
    : withoutBrand;
}

function normalizeComparableNoBrand(params: {
  value: string;
  brandName?: string | null;
}): string {
  return normalizeComparableText(stripBrandPrefixForComparison(params));
}

function normalizeBrandAgnosticQuery(params: {
  normalizedQueryNoPunct: string;
  brandName?: string | null;
}): string {
  const { normalizedQueryNoPunct, brandName } = params;
  const normalizedBrand = normalizeSearchQueryNoPunct(brandName ?? "");
  const queryWithoutBrand = normalizedBrand
    ? normalizedQueryNoPunct.replaceAll(normalizedBrand, "")
    : normalizedQueryNoPunct;

  return normalizeSearchQuery(brandName ?? "") === "nikon"
    ? queryWithoutBrand.replaceAll("nikkor", "")
    : queryWithoutBrand;
}

function relaxLensComparableText(value: string): string {
  return value.replace(/([0-9])mm/gi, "$1").replace(/f([0-9])/gi, "$1");
}

function regexMatches(value: string, pattern: string): boolean {
  return new RegExp(pattern, "i").test(value);
}

export function scoreSearchTextAgainstQuery(params: {
  query: string;
  searchText: string;
  brandName?: string | null;
}): number {
  const { query, searchText, brandName } = params;
  const tokens = parseSearchQueryTokens(query);
  const searchLower = normalizeSearchQuery(searchText);
  const normalizedCol = normalizeComparableText(searchText);
  const normalizedNoBrand = normalizeComparableNoBrand({ value: searchText, brandName });
  const normalizedQueryNoPunct = tokens.normalizedQueryNoPunct;
  const normalizedQueryNoBrand = normalizeBrandAgnosticQuery({
    normalizedQueryNoPunct,
    brandName,
  });
  const normalizedColRelaxed = relaxLensComparableText(normalizedCol);
  const normalizedNoBrandRelaxed = relaxLensComparableText(normalizedNoBrand);

  let score = 0;

  // Base contains signals
  if (searchLower.includes(tokens.normalizedQuery)) {
    score += SEARCH_RANKING_WEIGHTS.rawContains;
  }
  if (normalizedCol.includes(normalizedQueryNoPunct)) {
    score += SEARCH_RANKING_WEIGHTS.normalizedContains;
  }
  if (normalizedQueryNoBrand && normalizedNoBrand.includes(normalizedQueryNoBrand)) {
    score += SEARCH_RANKING_WEIGHTS.brandAgnosticContains;
  }
  if (
    normalizedNoBrandRelaxed.includes(normalizedQueryNoBrand) ||
    normalizedColRelaxed.includes(normalizedQueryNoPunct)
  ) {
    score += SEARCH_RANKING_WEIGHTS.relaxedContains;
  }

  // Additive token coverage bonuses
  for (const token of tokens.strongTextTokens) {
    if (searchLower.includes(token)) {
      score += SEARCH_RANKING_WEIGHTS.strongToken;
    }
  }
  for (const token of tokens.activeLensFeatureAcronymTokens) {
    if (regexMatches(searchLower, buildWholeWordTokenRegex(token))) {
      score += SEARCH_RANKING_WEIGHTS.featureAcronymToken;
    }
  }
  for (const token of tokens.focalLengthTokens) {
    if (regexMatches(searchLower, buildFocalLengthTokenRegex(token))) {
      score += SEARCH_RANKING_WEIGHTS.focalToken;
    }
  }
  for (const token of tokens.apertureTokens) {
    if (regexMatches(searchLower, buildApertureTokenRegex(token))) {
      score += SEARCH_RANKING_WEIGHTS.apertureToken;
    }
  }

  // Single-focal queries should prefer an exact focal hit over a zoom-range
  // overmatch that merely happens to include that focal length.
  if (tokens.focalLengthTokens.length === 1) {
    const focalToken = tokens.focalLengthTokens[0]!;
    const hasExactFocal = regexMatches(searchLower, buildFocalLengthTokenRegex(focalToken));
    const hasZoomOvermatch = regexMatches(
      searchLower,
      buildSingleFocalZoomOvermatchRegex(focalToken),
    );

    if (hasExactFocal && !hasZoomOvermatch) {
      score += SEARCH_RANKING_WEIGHTS.primarySingleFocal;
    }
    if (hasZoomOvermatch) {
      score -= SEARCH_RANKING_WEIGHTS.singleFocalZoomPenalty;
    }
  }

  return score;
}

export function shouldGateSingleNumericToken(params: {
  numericTokens: string[];
  strongParts: string[];
  normalizedQueryNoPunct: string;
}): boolean {
  const { numericTokens, strongParts, normalizedQueryNoPunct } = params;
  const singleNumericToken = numericTokens[0];
  const isStandaloneDecimalToken =
    singleNumericToken !== undefined &&
    singleNumericToken.includes(".") &&
    normalizedQueryNoPunct === singleNumericToken.replace(".", "");

  return (
    numericTokens.length === 1 &&
    (strongParts.length >= 1 || isStandaloneDecimalToken)
  );
}
