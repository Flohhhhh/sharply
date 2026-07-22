import { describe, expect, it } from "vitest";
import { resolveGearSlugFromSuggestion } from "~/lib/search/resolve-gear-slug";

describe("resolveGearSlugFromSuggestion", () => {
  it("uses an explicit slug when present", () => {
    expect(
      resolveGearSlugFromSuggestion({
        slug: "nikon-zf",
        href: "/gear/other",
      }),
    ).toBe("nikon-zf");
  });

  it("derives slug from suggest-api href when slug is missing", () => {
    expect(
      resolveGearSlugFromSuggestion({
        href: "/gear/canon-eos-r5",
      }),
    ).toBe("canon-eos-r5");
  });

  it("returns empty string for non-gear hrefs or missing values", () => {
    expect(resolveGearSlugFromSuggestion({ href: "/brand/nikon" })).toBe("");
    expect(resolveGearSlugFromSuggestion({ slug: "  " })).toBe("");
    expect(resolveGearSlugFromSuggestion({})).toBe("");
  });
});
