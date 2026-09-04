import { describe, expect, it } from "vitest";
import { hasActiveSearchState } from "~/lib/search/has-active-search-state";

describe("hasActiveSearchState", () => {
  it("keeps the default server result only for empty or transient state", () => {
    expect(hasActiveSearchState({})).toBe(false);
    expect(hasActiveSearchState({ nl: "1", nlIntent: "brand-lenses" })).toBe(
      false,
    );
  });

  it.each([
    ["query", { q: "nikon" }],
    ["tag", { tag: ["wildlife"] }],
    ["filter", { brand: "nikon" }],
    ["sort", { sort: "price_asc" }],
  ])("detects active %s state", (_label, params) => {
    expect(hasActiveSearchState(params)).toBe(true);
  });

  it("ignores empty recognized values", () => {
    expect(hasActiveSearchState({ q: " ", tag: ["", " "] })).toBe(false);
  });
});
