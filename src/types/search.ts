export type GearSuggestionMatchSource =
  | "localized"
  | "canonical"
  | "alias"
  | "fuzzy";

export type GearSuggestionKind = "camera" | "lens";
export type SuggestionKind = GearSuggestionKind | "brand" | "smart-action";
export type SuggestionType = "gear" | "brand" | "smart-action";

type SuggestionBase = {
  id: string;
  kind: SuggestionKind;
  type: SuggestionType;
  href: string;
  title: string;
  label: string;
  subtitle?: string | null;
  relevance?: number;
};

export type GearSuggestion = SuggestionBase & {
  kind: GearSuggestionKind;
  gearId: string;
  brandName: string | null;
  canonicalName: string;
  localizedName: string;
  matchedName: string;
  matchSource: GearSuggestionMatchSource;
  isBestMatch: boolean;
  gearType: string;
};

export type BrandSuggestion = SuggestionBase & {
  kind: "brand";
  brandId: string;
  brandName: string;
};

export type CompareSmartActionSuggestion = SuggestionBase & {
  kind: "smart-action";
  action: "compare";
  compareSlugs: [string, string];
  compareTitles: [string, string];
};

export type Suggestion =
  | GearSuggestion
  | BrandSuggestion
  | CompareSmartActionSuggestion;
