import { resolveGearSlugFromSuggestion } from "~/lib/search/resolve-gear-slug";
import type { GearSuggestion, Suggestion } from "~/types/search";

export type GearPickerOption = {
  id: string;
  slug: string;
  name: string;
  brandName?: string | null;
  gearType?: string | null;
  isBestMatch?: boolean;
};

export function isGearSuggestion(
  suggestion: Suggestion,
): suggestion is GearSuggestion {
  return suggestion.type === "gear";
}

/** Map suggest-api gear rows into combobox options; hoist best matches first. */
export function mapGearSuggestionsToOptions(
  suggestions: Suggestion[],
  excludeIds: string[] = [],
): GearPickerOption[] {
  const exclude = new Set(excludeIds.map(String));
  const gearRows = suggestions.filter(isGearSuggestion);

  const best: GearPickerOption[] = [];
  const rest: GearPickerOption[] = [];

  for (const suggestion of gearRows) {
    if (exclude.has(String(suggestion.gearId))) continue;
    const slug = resolveGearSlugFromSuggestion({ href: suggestion.href });
    if (!slug) continue;

    const option: GearPickerOption = {
      id: String(suggestion.gearId),
      slug,
      // Prefer localized title so the picker label matches suggest/modal without aliases.
      name:
        suggestion.localizedName ||
        suggestion.title ||
        suggestion.canonicalName,
      brandName: suggestion.brandName ?? null,
      gearType: suggestion.gearType ?? null,
      isBestMatch: suggestion.isBestMatch,
    };

    if (suggestion.isBestMatch) {
      best.push(option);
    } else {
      rest.push(option);
    }
  }

  return [...best, ...rest];
}
