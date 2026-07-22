import { describe, expect, it } from "vitest";
import { mapGearSuggestionsToOptions } from "~/lib/search/gear-picker-options";
import type { GearSuggestion, Suggestion } from "~/types/search";

function gearSuggestion(
  overrides: Partial<GearSuggestion> &
    Pick<GearSuggestion, "gearId" | "href">,
): GearSuggestion {
  const title = overrides.title ?? "Title";
  return {
    id: overrides.id ?? `gear:${overrides.gearId}`,
    kind: overrides.kind ?? "camera",
    type: "gear",
    gearId: overrides.gearId,
    href: overrides.href,
    title,
    label: overrides.label ?? title,
    brandName: overrides.brandName ?? "Nikon",
    canonicalName: overrides.canonicalName ?? "Canonical",
    localizedName: overrides.localizedName ?? title,
    matchedName: overrides.matchedName ?? title,
    matchSource: overrides.matchSource ?? "fuzzy",
    isBestMatch: overrides.isBestMatch ?? false,
    gearType: overrides.gearType ?? "CAMERA",
    relevance: overrides.relevance,
    subtitle: overrides.subtitle,
  };
}

describe("mapGearSuggestionsToOptions", () => {
  it("maps gear suggestions and hoists best matches first", () => {
    const suggestions: Suggestion[] = [
      gearSuggestion({
        gearId: "g1",
        href: "/gear/z6-iii",
        title: "Z6 III",
        canonicalName: "Nikon Z6 III",
        localizedName: "Z6 III",
        relevance: 0.9,
      }),
      gearSuggestion({
        gearId: "g2",
        href: "/gear/z5-ii",
        title: "Z5 II",
        canonicalName: "Nikon Z5 II",
        localizedName: "Z5 II",
        isBestMatch: true,
        relevance: 0.5,
      }),
      {
        id: "brand:b1",
        kind: "brand",
        type: "brand",
        brandId: "b1",
        brandName: "Nikon",
        title: "Nikon",
        label: "Nikon",
        href: "/brand/nikon",
      },
    ];

    const options = mapGearSuggestionsToOptions(suggestions);

    expect(options).toEqual([
      {
        id: "g2",
        slug: "z5-ii",
        name: "Z5 II",
        brandName: "Nikon",
        gearType: "CAMERA",
        isBestMatch: true,
      },
      {
        id: "g1",
        slug: "z6-iii",
        name: "Z6 III",
        brandName: "Nikon",
        gearType: "CAMERA",
        isBestMatch: false,
      },
    ]);
  });

  it("excludes ids and drops rows without a resolvable gear slug", () => {
    const options = mapGearSuggestionsToOptions(
      [
        gearSuggestion({
          gearId: "keep",
          href: "/gear/keep-me",
          title: "Keep",
          localizedName: "Keep",
        }),
        gearSuggestion({
          gearId: "drop",
          href: "/gear/drop-me",
          title: "Drop",
          localizedName: "Drop",
        }),
        gearSuggestion({
          gearId: "bad",
          href: "/brand/nikon",
          title: "Bad",
          localizedName: "Bad",
        }),
      ],
      ["drop"],
    );

    expect(options.map((option) => option.id)).toEqual(["keep"]);
  });
});
