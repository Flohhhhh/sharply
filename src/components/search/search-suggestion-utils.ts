"use client";

import type {
  GearSuggestion,
  Suggestion,
  SuggestionKind,
} from "~/types/search";

export function normalizeSearchText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function getSuggestionKind(suggestion: Suggestion): SuggestionKind {
  return suggestion.kind;
}

export function getSuggestionTitle(suggestion: Suggestion): string {
  return suggestion.title ?? suggestion.label;
}

export function getSuggestionSubtitle(suggestion: Suggestion): string | undefined {
  if (typeof suggestion.subtitle === "string" && suggestion.subtitle.trim()) {
    return suggestion.subtitle.trim();
  }

  if (suggestion.kind === "camera" || suggestion.kind === "lens") {
    if (
      normalizeSearchText(suggestion.title) !==
      normalizeSearchText(suggestion.canonicalName)
    ) {
      return suggestion.canonicalName;
    }
    if (suggestion.gearType === "LENS") return "Lens";
    if (suggestion.gearType === "ANALOG_CAMERA") return "Analog Camera";
    return "Camera";
  }

  if (suggestion.kind === "brand") {
    return "Brand";
  }

  return undefined;
}

export function getSuggestionMeta(suggestion: Suggestion): string | undefined {
  if (suggestion.kind === "camera" || suggestion.kind === "lens") {
    return undefined;
  }

  if (suggestion.kind === "brand") {
    return "Brand";
  }

  return undefined;
}

export function isBestMatchSuggestion(suggestion: Suggestion): boolean {
  return (
    (suggestion.kind === "camera" || suggestion.kind === "lens") &&
    suggestion.isBestMatch
  );
}

export function isSmartActionSuggestion(suggestion: Suggestion): boolean {
  return suggestion.kind === "smart-action";
}

export function asGearSuggestion(
  suggestion: Suggestion | null | undefined,
): GearSuggestion | null {
  return suggestion?.kind === "camera" || suggestion?.kind === "lens"
    ? suggestion
    : null;
}
