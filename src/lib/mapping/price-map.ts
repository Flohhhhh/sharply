/**
 * Simple price formatting utilities for converting cents to readable currency
 */

/**
 * Format price from cents to readable currency string
 * @param priceCents - Price in cents (e.g., 324900 for $3,249.00)
 * @returns Formatted price string (e.g., "$3,249.00")
 */
export function formatPrice(priceCents: number | null | undefined): string {
  if (priceCents === null || priceCents === undefined)
    return "Price not available";

  const dollars = priceCents / 100;
  return `$${dollars.toLocaleString()} USD`;
}
