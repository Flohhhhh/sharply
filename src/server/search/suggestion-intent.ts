import { GetGearDisplayName, normalizeGearSearchText } from "~/lib/gear/naming";
import type { GearAlias, GearRegion } from "~/types/gear";
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
  source: GearSuggestionMatchSource;
};

type CandidateMatch = MatchCandidate & {
  rank: number;
};

const COMPARE_QUERY_RE =
  /^\s*(?:compare\s+)?(.+?)\s+(?:vs|versus)\s+(.+?)\s*$/i;

function normalizeExactMatchValue(value: string) {
  return normalizeGearSearchText(value).replace(/\s+/g, "");
}

function stripBrandPrefix(value: string, brandName: string | null) {
  const normalizedValue = normalizeGearSearchText(value);
  const normalizedBrand = normalizeGearSearchText(brandName ?? "");

  if (!normalizedBrand) return normalizedValue;
  if (!normalizedValue.startsWith(`${normalizedBrand} `)) return normalizedValue;

  return normalizedValue.slice(normalizedBrand.length).trim();
}

function buildMatchCandidates(
  item: GearSuggestionInput,
  region?: GearRegion | null,
): MatchCandidate[] {
  const candidates: MatchCandidate[] = [];
  const pushUnique = (value: string, source: GearSuggestionMatchSource) => {
    const normalized = normalizeExactMatchValue(value);
    if (!normalized) return;
    if (
      candidates.some(
        (entry) => normalizeExactMatchValue(entry.value) === normalized,
      )
    ) {
      return;
    }
    candidates.push({ value, source });

    const brandStripped = stripBrandPrefix(value, item.brandName);
    if (brandStripped && brandStripped !== normalizeGearSearchText(value)) {
      const strippedNormalized = normalizeExactMatchValue(brandStripped);
      if (
        strippedNormalized &&
        !candidates.some(
          (entry) =>
            normalizeExactMatchValue(entry.value) === strippedNormalized,
        )
      ) {
        candidates.push({ value: brandStripped, source });
      }
    }
  };

  const localizedName = GetGearDisplayName(
    { name: item.name, regionalAliases: item.regionalAliases ?? [] },
    { region },
  );

  pushUnique(localizedName, "localized");
  pushUnique(item.name, "canonical");

  for (const alias of item.regionalAliases ?? []) {
    pushUnique(alias.name, "alias");
  }

  return candidates;
}

function getCandidateMatch(
  query: string,
  candidate: MatchCandidate,
): CandidateMatch | null {
  const normalizedQuery = normalizeExactMatchValue(query);
  const normalizedCandidate = normalizeExactMatchValue(candidate.value);

  if (!normalizedQuery || !normalizedCandidate) return null;
  if (normalizedCandidate === normalizedQuery) {
    return { ...candidate, rank: 300 };
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

  const exactHits = new Map<string, number>();
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

    if (bestMatch.rank >= 300) {
      exactHits.set(normalizedQuery, (exactHits.get(normalizedQuery) ?? 0) + 1);
    }
  }

  const uniqueExactMatch = exactHits.get(normalizedQuery) === 1;

  return suggestions.map((suggestion) => {
    const metadata = metadataBySuggestionId.get(suggestion.id);
    if (!metadata) return suggestion;

    return {
      ...suggestion,
      matchedName: metadata.matchedName,
      matchSource: metadata.matchSource,
      isBestMatch: uniqueExactMatch && metadata.rank >= 300,
    };
  });
}
