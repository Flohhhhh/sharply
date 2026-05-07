import { describe, expect, it } from "vitest";

import { formatPrice, normalizePriceCents, PRICE_FALLBACK_TEXT } from "~/lib/mapping";

describe("price-map", () => {
  it("formats numeric string cents as currency", () => {
    expect(normalizePriceCents("202900")).toBe(202900);
    expect(formatPrice("202900")).toBe("$2,029 USD");
  });

  it("rejects fractional cent inputs", () => {
    expect(normalizePriceCents(2029.5)).toBeNull();
    expect(normalizePriceCents("2029.5")).toBeNull();
    expect(formatPrice("2029.5")).toBe(PRICE_FALLBACK_TEXT);
  });

  it("falls back for non-numeric price values", () => {
    expect(normalizePriceCents("abc")).toBeNull();
    expect(formatPrice("abc")).toBe(PRICE_FALLBACK_TEXT);
  });
});
