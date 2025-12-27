/**
 * Utilities for validating B&H product links to prevent open redirects.
 *
 * We allow only known B&H domains and normalize the URL to https.
 */

const ALLOWED_HOSTS = new Set([
  "bhphotovideo.com",
  "www.bhphotovideo.com",
  "bhpho.to",
]);

const PRODUCT_PATH_REGEX = /\/c\/product\/([A-Za-z0-9_-]+)(?:\/|$)/i;

function tryParseUrl(input: string): URL | null {
  try {
    const withScheme = /^(https?:)?\/\//i.test(input)
      ? input
      : `https://${input}`;
    return new URL(withScheme);
  } catch {
    return null;
  }
}

function isAllowedHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return ALLOWED_HOSTS.has(normalized);
}

function buildCanonicalProductUrl(productKey: string): string {
  return `https://www.bhphotovideo.com/c/product/${productKey}/`;
}

/**
 * Normalize a B&H product link to its canonical form:
 * https://www.bhphotovideo.com/c/product/<productKey>/
 *
 * Returns null if the URL is not recognized as a valid B&H product link.
 */
export function normalizeBhProductLink(input?: string | null): string | null {
  const trimmed = (input ?? "").trim();
  if (!trimmed) return null;

  const parsed = tryParseUrl(trimmed);
  if (!parsed || !isAllowedHost(parsed.hostname)) return null;

  const match = parsed.pathname.match(PRODUCT_PATH_REGEX);
  const productKey = match?.[1];
  if (!productKey) return null;

  return buildCanonicalProductUrl(productKey);
}

/**
 * Return a normalized https B&H URL or null if the input is not acceptable.
 */
export function parseBhProductUrl(input?: string | null): string | null {
  return normalizeBhProductLink(input);
}

