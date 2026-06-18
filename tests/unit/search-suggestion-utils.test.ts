import { describe, expect, it } from "vitest";
import {
  getSuggestionSubtitle,
  getSuggestionTitle,
} from "~/components/search/search-suggestion-utils";
import type { GearSuggestion } from "~/types/search";

const translations = {
  camera: "Camera",
  lens: "Lens",
  analogCamera: "Analog Camera",
  brand: "Brand",
};

function makeGearSuggestion(
  overrides: Partial<GearSuggestion> = {},
): GearSuggestion {
  return {
    id: "gear:1",
    kind: "camera",
    type: "gear",
    gearId: "1",
    href: "/gear/canon-eos-rebel-t5",
    title: "Canon EOS Rebel T5",
    label: "Canon EOS Rebel T5",
    subtitle: "Camera",
    relevance: 1,
    brandName: "Canon",
    canonicalName: "Canon EOS Rebel T5",
    localizedName: "Canon EOS Rebel T5",
    matchedName: "Canon EOS Rebel T5",
    matchSource: "fuzzy",
    isBestMatch: false,
    gearType: "CAMERA",
    ...overrides,
  };
}

describe("search suggestion utils", () => {
  it("prefers the matched alias as the visible title when it differs from the viewer-local name", () => {
    const suggestion = makeGearSuggestion({
      title: "Canon EOS Rebel T5",
      label: "Canon EOS Rebel T5",
      subtitle: "Canon EOS Rebel T5",
      localizedName: "Canon EOS Rebel T5",
      matchedName: "Canon EOS 1200D",
      matchSource: "alias",
    });

    expect(getSuggestionTitle(suggestion)).toBe("Canon EOS 1200D");
    expect(getSuggestionSubtitle(suggestion, translations)).toBe(
      "Canon EOS Rebel T5",
    );
  });

  it("preserves the existing title and subtitle when the localized name already matches the alias", () => {
    const suggestion = makeGearSuggestion({
      title: "Lumix GF9",
      label: "Lumix GF9",
      subtitle: "Panasonic GX850",
      canonicalName: "Panasonic GX850",
      localizedName: "Lumix GF9",
      matchedName: "Lumix GF9",
      matchSource: "alias",
    });

    expect(getSuggestionTitle(suggestion)).toBe("Lumix GF9");
    expect(getSuggestionSubtitle(suggestion, translations)).toBe(
      "Panasonic GX850",
    );
  });
});
