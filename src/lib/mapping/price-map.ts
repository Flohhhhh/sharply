/**
 * Simple price formatting utilities for converting cents to readable currency
 */

/**
 * Format price from cents to readable currency string
 * @param priceCents - Price in cents (e.g., 324900 for $3,249.00)
 * @returns Formatted price string (e.g., "$3,249.00")
 */
const USD_COMPACT = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function formatPrice(priceCents: number | null | undefined): string {
  if (!isFiniteNumber(priceCents)) return "Price not available";

  const dollars = priceCents / 100;
  return `$${dollars.toLocaleString()} USD`;
}

export type PreferredPriceSource = "mpb_max" | "msrp_now";

export type PreferredPriceResult = {
  source: PreferredPriceSource | null;
  sourceLabel: string | null;
  amountText: string | null;
  displayText: string;
  hasPrice: boolean;
};

const SOURCE_LABELS: Record<PreferredPriceSource, string> = {
  mpb_max: "MPB",
  msrp_now: "MSRP",
};

function formatUsdCompact(priceCents: number) {
  return USD_COMPACT.format(priceCents / 100);
}

export function formatPreferredPrice(options: {
  mpbMaxPriceUsdCents?: number | null;
  msrpNowUsdCents?: number | null;
  fallbackText?: string;
}): PreferredPriceResult {
  const fallbackText = options.fallbackText ?? "Price TBD";

  const buildResult = (
    source: PreferredPriceSource,
    cents: number,
  ): PreferredPriceResult => {
    const amountText = formatUsdCompact(cents);
    return {
      source,
      sourceLabel: SOURCE_LABELS[source],
      amountText,
      displayText: amountText,
      hasPrice: true,
    };
  };

  if (isFiniteNumber(options.mpbMaxPriceUsdCents)) {
    return buildResult("mpb_max", options.mpbMaxPriceUsdCents);
  }

  if (isFiniteNumber(options.msrpNowUsdCents)) {
    return buildResult("msrp_now", options.msrpNowUsdCents);
  }

  return {
    source: null,
    sourceLabel: null,
    amountText: null,
    displayText: fallbackText,
    hasPrice: false,
  };
}
