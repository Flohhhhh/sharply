export type Market = "US" | "UK" | "EU";

const MPB_HOSTNAME = "www.mpb.com";

const MPB_MARKET_PATH_SEGMENT: Record<Market, string> = {
  US: "en-us",
  UK: "en-uk",
  EU: "en-eu",
};

interface GetMpbDestinationUrlInput {
  market: Market;
  destinationPath: string;
}

/**
 * Build a direct MPB destination URL using the requested storefront path prefix.
 */
export function getMpbDestinationUrl(input: GetMpbDestinationUrlInput) {
  return buildDestinationAddress(input.destinationPath, input.market);
}

function buildDestinationAddress(destinationPath: string, market: Market) {
  const cleanedDestinationPath = destinationPath.trim();

  if (cleanedDestinationPath === "") {
    throw new Error("Destination path cannot be empty when building MPB link.");
  }

  if (isHttpAddress(cleanedDestinationPath)) {
    return buildDestinationAddressFromAbsolute(cleanedDestinationPath, market);
  }

  return buildDestinationAddressFromRelative(cleanedDestinationPath, market);
}

function isHttpAddress(value: string) {
  return value.startsWith("http://") || value.startsWith("https://");
}

function buildDestinationAddressFromAbsolute(address: string, market: Market) {
  const parsedAddress = new URL(address);
  if (!isMpbHostname(parsedAddress.hostname)) {
    throw new Error("MPB destination must use an MPB hostname.");
  }

  parsedAddress.protocol = "https:";
  parsedAddress.hostname = MPB_HOSTNAME;
  parsedAddress.port = "";
  parsedAddress.pathname = buildMarketPath(parsedAddress.pathname, market);
  return parsedAddress.toString();
}

function buildDestinationAddressFromRelative(address: string, market: Market) {
  const parsedAddress = new URL(
    ensureLeadingSlash(address),
    `https://${MPB_HOSTNAME}`,
  );
  parsedAddress.pathname = buildMarketPath(parsedAddress.pathname, market);
  return parsedAddress.toString();
}

function buildMarketPath(pathname: string, market: Market) {
  const normalizedSegment = stripMarketSegmentFromPath(pathname);
  return `/${MPB_MARKET_PATH_SEGMENT[market]}${normalizedSegment}`;
}

function stripMarketSegmentFromPath(path: string) {
  return ensureLeadingSlash(path).replace(/^\/en-[^/]+/i, "");
}

function ensureLeadingSlash(value: string) {
  return value.startsWith("/") ? value : `/${value}`;
}

function isMpbHostname(hostname: string) {
  const normalizedHostname = hostname.toLowerCase();
  return normalizedHostname === MPB_HOSTNAME || normalizedHostname === "mpb.com";
}
