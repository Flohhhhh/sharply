/**
 * Simple price formatting utilities for converting cents to readable currency
 */

import type { GearItem } from "~/types/gear";

const PRICE_FALLBACK_TEXT = "Price not available";

type FormatPriceOptions = {
  /**
   * Long style adds the USD suffix (used on detail pages) while the short style
   * keeps the value compact for cards and badges.
   */
  style?: "long" | "short";
};

/**
 * Format price from cents to readable currency string
 * @param priceCents - Price in cents (e.g., 324900 for $3,249.00)
 * @returns Formatted price string (e.g., "$3,249.00")
 */
export function formatPrice(
  priceCents: number | null | undefined,
  { style = "long" }: FormatPriceOptions = {},
): string {
  if (priceCents === null || priceCents === undefined)
    return PRICE_FALLBACK_TEXT;

  const dollars = priceCents / 100;
  const formatted = dollars.toLocaleString();
  return style === "short" ? `$${formatted}` : `$${formatted} USD`;
}

/**
 * Determine the display-ready price using MPB as the preferred source with
 * MSRP as a fallback. When no values exist we render a helpful empty state.
 */
export function getItemDisplayPrice(
  item: GearItem | null | undefined,
  { style = "long" }: FormatPriceOptions = {},
): string {
  const cents =
    typeof item?.mpbMaxPriceUsdCents === "number"
      ? item.mpbMaxPriceUsdCents
      : typeof item?.msrpNowUsdCents === "number"
        ? item.msrpNowUsdCents
        : null;
  return formatPrice(cents, { style });
}
