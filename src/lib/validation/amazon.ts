/**
 * Utilities for working with Amazon product links.
 *
 * Goals:
 * - Extract ASIN from a variety of Amazon URL shapes
 * - Canonicalize to https://www.amazon.com/dp/<ASIN>
 * - Be portable so we can later append affiliate tags without changing callers
 */

export interface AmazonUrlOptions {
  /**
   * Optional affiliate tag to append. If omitted, no tag is added.
   */
  affiliateTag?: string;
  /**
   * Host to use for canonical links. Defaults to "www.amazon.com".
   */
  host?: string;
}

const DEFAULT_HOST = "www.amazon.com";

function tryParseUrl(input: string): URL | null {
  try {
    // Add protocol if missing
    const withScheme = /^(https?:)?\/\//i.test(input)
      ? input
      : `https://${input}`;
    return new URL(withScheme);
  } catch {
    return null;
  }
}

function extractAsinFromPath(pathname: string): string | null {
  // Common Amazon path patterns that contain the ASIN
  const patterns: RegExp[] = [
    /\/dp\/([A-Z0-9]{10})(?:[\/\?#]|$)/i,
    /\/gp\/product\/([A-Z0-9]{10})(?:[\/\?#]|$)/i,
    /\/gp\/aw\/d\/([A-Z0-9]{10})(?:[\/\?#]|$)/i,
    /\/gp\/offer-listing\/([A-Z0-9]{10})(?:[\/\?#]|$)/i,
    /\/product-reviews\/([A-Z0-9]{10})(?:[\/\?#]|$)/i,
    /\/[^/]*\/dp\/([A-Z0-9]{10})(?:[\/\?#]|$)/i, // e.g., /Some-Title/dp/ASIN
    /\/(?:[^/]+\/)*dp\/([A-Z0-9]{10})(?:[\/\?#]|$)/i, // multiple segments before dp
  ];
  for (const re of patterns) {
    const m = pathname.match(re);
    if (m?.[1]) return m[1].toUpperCase();
  }
  return null;
}

function extractAsinFromQuery(url: URL): string | null {
  const candidates = ["asin", "ASIN", "k"]; // sometimes asin appears as a param
  for (const key of candidates) {
    const v = url.searchParams.get(key);
    if (v && /^[A-Z0-9]{10}$/i.test(v)) return v.toUpperCase();
  }
  return null;
}

function looksLikeAmazonHost(hostname: string): boolean {
  // Accept any amazon.<tld> including regional domains
  return /(^|\.)amazon\./i.test(hostname);
}

function buildCanonicalUrl(asin: string, options?: AmazonUrlOptions): string {
  const host = options?.host || DEFAULT_HOST;
  const url = new URL(`https://${host}/dp/${asin}`);
  if (options?.affiliateTag) {
    url.searchParams.set("tag", options.affiliateTag);
  }
  return url.toString();
}

/**
 * Normalize any Amazon product-ish link into a canonical dp URL on amazon.com.
 *
 * Returns the canonical URL if an ASIN can be extracted; otherwise returns null.
 */
export function normalizeAmazonProductLink(
  input: string,
  options?: AmazonUrlOptions,
): string | null {
  const trimmed = (input || "").trim();
  if (!trimmed) return null;

  const parsed = tryParseUrl(trimmed);
  if (!parsed) return null;

  if (!looksLikeAmazonHost(parsed.hostname)) {
    // Non-Amazon links are not canonicalizable here
    return null;
  }

  // Extract ASIN from path or query
  const asin =
    extractAsinFromPath(parsed.pathname) || extractAsinFromQuery(parsed);
  if (!asin) return null;

  return buildCanonicalUrl(asin, options);
}

/**
 * Try to parse an ASIN from user input (either a raw ASIN or an Amazon URL).
 * Returns the upper-case ASIN or null if the input cannot be interpreted.
 */
export function parseAmazonAsin(input?: string | null): string | null {
  const trimmed = (input ?? "").trim();
  if (!trimmed) return null;

  const upperCased = trimmed.toUpperCase();
  if (/^[A-Z0-9]{10}$/.test(upperCased)) {
    return upperCased;
  }

  const canonical = normalizeAmazonProductLink(trimmed);
  if (canonical) {
    const match = canonical.match(/\/dp\/([A-Z0-9]{10})(?:[\/\?#]|$)/i);
    if (match?.[1]) {
      return match[1].toUpperCase();
    }
  }

  // Fallback: look for dp/ASIN even if canonicalization did not run
  const fallbackMatch = trimmed.match(/\/dp\/([A-Z0-9]{10})(?:[\/\?#]|$)/i);
  if (fallbackMatch?.[1]) {
    return fallbackMatch[1].toUpperCase();
  }

  return null;
}

/**
 * Build a canonical Amazon product URL from an ASIN and options.
 */
export function buildAmazonProductUrl(
  asin: string,
  options?: AmazonUrlOptions,
): string {
  const cleaned = (asin || "").trim().toUpperCase();
  if (!/^[A-Z0-9]{10}$/.test(cleaned)) {
    throw new Error("Invalid ASIN: must be 10 alphanumeric characters");
  }
  return buildCanonicalUrl(cleaned, options);
}

/**
 * Produce a clean, human-displayable Amazon product URL without any extras
 * (no query params, no affiliate tag), using the default host.
 * If the URL is not an Amazon product link, returns null.
 */
export function toDisplayAmazonProductLink(url: string): string | null {
  const parsed = tryParseUrl(url);
  if (!parsed || !looksLikeAmazonHost(parsed.hostname)) return null;
  const asin =
    extractAsinFromPath(parsed.pathname) || extractAsinFromQuery(parsed);
  if (!asin) return null;
  return buildCanonicalUrl(asin, { host: DEFAULT_HOST });
}
