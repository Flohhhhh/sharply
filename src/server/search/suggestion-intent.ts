import { GetGearDisplayName,normalizeGearSearchText } from "~/lib/gear/naming";
import type { GearAlias,GearRegion } from "~/types/gear";
import type {
  GearSuggestion,
  GearSuggestionKind,
  GearSuggestionMatchSource,
} from "~/types/search";

type GearSuggestionInput = {
  id: string;
  name: string;
  slug: string;
  brandName: string | null;
  gearType: string;
  relevance?: number;
  regionalAliases?: GearAlias[] | null;
};

type CompareIntent = {
  left: string;
  right: string;
};

type MatchCandidate = {
  value: string;
  matchValue?: string;
  source: GearSuggestionMatchSource;
};

type CandidateMatch = MatchCandidate & {
  rank: number;
};

const COMPARE_QUERY_RE =
  /^\s*(?:compare\s+)?(.+?)\s+(?:vs|versus)\s+(.+?)\s*$/i;
const LENS_FEATURE_SHORTHAND_RE = /\b(pf|vr|is|oss|ois|vc|os|stm|usm|hsm|ssm)\b/gi;
const LENS_FOCAL_LENGTH_RE =
  /(\d+(?:\.\d+)?)(?:\s*-\s*(\d+(?:\.\d+)?))?\s*mm\b/i;
const LENS_APERTURE_RE = /(?:f|t)\s*\/?\s*(\d+(?:\.\d+)?)([a-z])?/i;
const FOCAL_LENGTH_TOKEN_WITH_MM_RE = /^(\d+(?:\.\d+)?)mm$/i;

function normalizeExactMatchValue(value: string) {
  return normalizeGearSearchText(value).replace(/\s+/g, "");
}

function getInformativeMatchTokens(value: string): string[] {
  return normalizeGearSearchText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

function expandEquivalentMatchTokens(value: string): Set<string> {
  const baseTokens = getInformativeMatchTokens(value);
  const expandedTokens = new Set(baseTokens);

  for (const token of baseTokens) {
    const focalLengthMatch = token.match(FOCAL_LENGTH_TOKEN_WITH_MM_RE);
    if (!focalLengthMatch) continue;
    expandedTokens.add(focalLengthMatch[1]!);
  }

  return expandedTokens;
}

function stripBrandPrefix(value: string, brandName: string | null) {
  const normalizedValue = normalizeGearSearchText(value);
  const normalizedBrand = normalizeGearSearchText(brandName ?? "");

  if (!normalizedBrand) return normalizedValue;
  if (!normalizedValue.startsWith(`${normalizedBrand} `)) return normalizedValue;

  return normalizedValue.slice(normalizedBrand.length).trim();
}

function buildLensShorthandCandidates(value: string): string[] {
  const focalMatch = value.match(LENS_FOCAL_LENGTH_RE);
  const apertureMatch = value.match(LENS_APERTURE_RE);
  const featureMatches = Array.from(
    value.matchAll(LENS_FEATURE_SHORTHAND_RE),
    (match) => match[1]?.toLowerCase() ?? "",
  ).filter(Boolean);

  const focalMin = focalMatch?.[1];
  const focalMax = focalMatch?.[2];
  const focalRange = focalMin
    ? focalMax
      ? [`${focalMin}-${focalMax}`, `${focalMin} ${focalMax}`]
      : [`${focalMin}mm`, focalMin]
    : [];
  const apertureValue = apertureMatch?.[1];
  const apertureSuffix = apertureMatch?.[2]?.toLowerCase() ?? "";
  const apertureToken = apertureValue
    ? `${apertureValue}${apertureSuffix}`
    : null;
  const featureTokens = Array.from(new Set(featureMatches));
  const candidates = new Set<string>();

  for (const focal of focalRange) {
    candidates.add(focal);

    if (apertureToken) {
      candidates.add(`${focal} ${apertureToken}`);
    }

    for (const feature of featureTokens) {
      candidates.add(`${focal} ${feature}`);
    }
  }

  return Array.from(candidates);
}

function buildMatchCandidates(
  item: GearSuggestionInput,
  region?: GearRegion | null,
): MatchCandidate[] {
  const candidates: MatchCandidate[] = [];
  const hasCandidate = (normalized: string) =>
    candidates.some(
      (entry) =>
        normalizeExactMatchValue(entry.matchValue ?? entry.value) === normalized,
    );
  const pushUnique = (
    value: string,
    source: GearSuggestionMatchSource,
    matchValue?: string,
  ) => {
    const normalized = normalizeExactMatchValue(matchValue ?? value);
    if (!normalized) return;
    if (hasCandidate(normalized)) return;
    candidates.push(matchValue ? { value, matchValue, source } : { value, source });

    const brandStripped = stripBrandPrefix(value, item.brandName);
    if (brandStripped && brandStripped !== normalizeGearSearchText(value)) {
      const strippedNormalized = normalizeExactMatchValue(brandStripped);
      if (strippedNormalized && !hasCandidate(strippedNormalized)) {
        candidates.push({
          value,
          matchValue: brandStripped,
          source,
        });
      }
    }
  };
  const pushLensShorthandCandidates = (value: string) => {
    if (item.gearType !== "LENS") return;

    for (const shorthand of buildLensShorthandCandidates(value)) {
      pushUnique(value, "canonical", shorthand);
    }
  };

  const pushValueAndDerivedCandidates = (
    value: string,
    source: GearSuggestionMatchSource,
  ) => {
    pushUnique(value, source);
    if (source === "alias") {
      pushLensShorthandCandidates(value);
    }
    if (source === "localized" || source === "canonical") {
      pushLensShorthandCandidates(value);
    }
  }

  const localizedName = GetGearDisplayName(
    { name: item.name, regionalAliases: item.regionalAliases ?? [] },
    { region },
  );

  pushValueAndDerivedCandidates(localizedName, "localized");
  pushValueAndDerivedCandidates(item.name, "canonical");

  for (const alias of item.regionalAliases ?? []) {
    pushValueAndDerivedCandidates(alias.name, "alias");
  }

  return candidates;
}

function getCandidateMatch(
  query: string,
  candidate: MatchCandidate,
): CandidateMatch | null {
  const normalizedQuery = normalizeExactMatchValue(query);
  const normalizedCandidate = normalizeExactMatchValue(
    candidate.matchValue ?? candidate.value,
  );
  const queryTokens = getInformativeMatchTokens(query);
  const candidateTokens = expandEquivalentMatchTokens(
    candidate.matchValue ?? candidate.value,
  );

  if (!normalizedQuery || !normalizedCandidate) return null;
  if (normalizedCandidate === normalizedQuery) {
    return { ...candidate, rank: 300 };
  }
  if (
    queryTokens.length >= 2 &&
    queryTokens.every((token) => candidateTokens.has(token))
  ) {
    return { ...candidate, rank: 250 };
  }
  if (normalizedCandidate.startsWith(normalizedQuery)) {
    return { ...candidate, rank: 200 };
  }
  if (normalizedCandidate.includes(normalizedQuery)) {
    return { ...candidate, rank: 100 };
  }
  return null;
}

function pickSubtitle(params: {
  title: string;
  canonicalName: string;
  gearType: string;
}) {
  const { title, canonicalName, gearType } = params;
  if (normalizeExactMatchValue(title) !== normalizeExactMatchValue(canonicalName)) {
    return canonicalName;
  }
  if (gearType === "LENS") return "Lens";
  if (gearType === "ANALOG_CAMERA") return "Analog Camera";
  return "Camera";
}

function applyAliasFirstPresentation(
  suggestion: GearSuggestion,
  canonicalName: string,
): GearSuggestion {
  const matchedName = suggestion.matchedName.trim();
  const localizedName = suggestion.localizedName.trim();

  if (suggestion.matchSource !== "alias") {
    return suggestion;
  }

  if (!matchedName || !localizedName) {
    return suggestion;
  }

  if (
    normalizeExactMatchValue(matchedName) ===
    normalizeExactMatchValue(localizedName)
  ) {
    return suggestion;
  }

  return {
    ...suggestion,
    title: matchedName,
    label: matchedName,
    subtitle: localizedName,
    canonicalName,
  };
}

export function parseCompareIntent(query: string): CompareIntent | null {
  const match = query.match(COMPARE_QUERY_RE);
  if (!match) return null;

  const left = match[1]?.trim() ?? "";
  const right = match[2]?.trim() ?? "";
  if (left.length < 2 || right.length < 2) return null;

  return { left, right };
}

export function buildGearSuggestion(
  item: GearSuggestionInput,
  region?: GearRegion | null,
): GearSuggestion {
  const suggestionKind: GearSuggestionKind =
    item.gearType === "LENS" ? "lens" : "camera";
  const localizedName = GetGearDisplayName(
    { name: item.name, regionalAliases: item.regionalAliases ?? [] },
    { region },
  );

  return {
    id: `gear:${item.id}`,
    kind: suggestionKind,
    type: "gear",
    gearId: item.id,
    href: `/gear/${item.slug}`,
    title: localizedName,
    label: localizedName,
    subtitle: pickSubtitle({
      title: localizedName,
      canonicalName: item.name,
      gearType: item.gearType,
    }),
    relevance: item.relevance,
    brandName: item.brandName,
    canonicalName: item.name,
    localizedName,
    matchedName: localizedName,
    matchSource: "fuzzy",
    isBestMatch: false,
    gearType: item.gearType,
  };
}

export function applyExactMatchMetadata(
  query: string,
  suggestions: GearSuggestion[],
  suggestionInputs: Map<string, GearSuggestionInput>,
  region?: GearRegion | null,
): GearSuggestion[] {
  const normalizedQuery = normalizeExactMatchValue(query);
  if (!normalizedQuery) return suggestions;

  const highConfidenceHits = new Map<string, number>();
  const metadataBySuggestionId = new Map<
    string,
    {
      matchedName: string;
      matchSource: GearSuggestionMatchSource;
      rank: number;
    }
  >();

  for (const suggestion of suggestions) {
    const input = suggestionInputs.get(suggestion.gearId);
    if (!input) continue;

    const candidates = buildMatchCandidates(input, region);
    const rankedMatches = candidates
      .map((candidate) => getCandidateMatch(query, candidate))
      .filter((candidate): candidate is CandidateMatch => Boolean(candidate))
      .sort((a, b) => b.rank - a.rank);

    const bestMatch = rankedMatches[0];
    if (!bestMatch) continue;

    metadataBySuggestionId.set(suggestion.id, {
      matchedName: bestMatch.value,
      matchSource: bestMatch.source,
      rank: bestMatch.rank,
    });

    if (bestMatch.rank >= 250) {
      highConfidenceHits.set(
        normalizedQuery,
        (highConfidenceHits.get(normalizedQuery) ?? 0) + 1,
      );
    }
  }

  const uniqueHighConfidenceMatch = highConfidenceHits.get(normalizedQuery) === 1;

  return suggestions.map((suggestion) => {
    const metadata = metadataBySuggestionId.get(suggestion.id);
    if (!metadata) return suggestion;

    return applyAliasFirstPresentation(
      {
        ...suggestion,
        matchedName: metadata.matchedName,
        matchSource: metadata.matchSource,
        isBestMatch: uniqueHighConfidenceMatch && metadata.rank >= 250,
      },
      suggestion.canonicalName,
    );
  });
}
