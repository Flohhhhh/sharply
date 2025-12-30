import { env } from "~/env";

export type Market = "US" | "UK" | "EU";

const MPB_HOSTNAME = "www.mpb.com";
const MPB_CAMPAIGN_REFERENCE_ENV_NAME: Record<Market, string> = {
  US: "MPB_PARTNERIZE_PREFIX_US",
  UK: "MPB_PARTNERIZE_PREFIX_UK",
  EU: "MPB_PARTNERIZE_PREFIX_EU",
};

const MPB_MARKET_PATH_SEGMENT: Record<Market, string> = {
  US: "en-us",
  UK: "en-uk",
  EU: "en-eu",
};

const MPB_CAMPAIGN_REFERENCE_GETTER: Record<Market, () => string | undefined> =
  {
    US: () => env.MPB_PARTNERIZE_PREFIX_US,
    UK: () => env.MPB_PARTNERIZE_PREFIX_UK,
    EU: () => env.MPB_PARTNERIZE_PREFIX_EU,
  };

interface BuildMpbPartnerizeUrlInput {
  market: Market;
  destinationPath: string;
  pubref?: string;
}

/**
 * Build a Partnerize deep link for MPB using the configured campaign reference for the
 * requested market and encode the region-specific destination.
 */
export function buildMpbPartnerizeUrl(input: BuildMpbPartnerizeUrlInput) {
  const destinationAddress = buildDestinationAddress(
    input.destinationPath,
    input.market,
  );
  const campaignReference = getCampaignReferenceForMarket(input.market);

  const partnerizeAddressParts = [
    `${env.MPB_PARTNERIZE_BASE_URL ?? "https://sharplyphoto.prf.hn/click"}/camref:${encodeURIComponent(campaignReference)}`,
    `destination:${encodeURIComponent(destinationAddress)}`,
  ];

  if (input.pubref) {
    partnerizeAddressParts.push(`pubref:${encodeURIComponent(input.pubref)}`);
  }

  return partnerizeAddressParts.join("/");
}

function getCampaignReferenceForMarket(market: Market) {
  const campaignReference = MPB_CAMPAIGN_REFERENCE_GETTER[market]();
  if (!campaignReference) {
    throw new Error(
      `Missing ${MPB_CAMPAIGN_REFERENCE_ENV_NAME[market]} for ${market} MPB links.`,
    );
  }
  return campaignReference;
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
    return parsedAddress.toString();
  }

  const normalizedSegment = stripMarketSegmentFromPath(parsedAddress.pathname);
  parsedAddress.pathname = `/${MPB_MARKET_PATH_SEGMENT[market]}${normalizedSegment}`;
  return parsedAddress.toString();
}

function buildDestinationAddressFromRelative(address: string, market: Market) {
  const pathWithLeadingSlash = ensureLeadingSlash(address);
  const normalizedSegment = stripMarketSegmentFromPath(pathWithLeadingSlash);
  const marketPath = `/${MPB_MARKET_PATH_SEGMENT[market]}${normalizedSegment}`;
  return new URL(marketPath, `https://${MPB_HOSTNAME}`).toString();
}

function stripMarketSegmentFromPath(path: string) {
  return path.replace(/^\/en-[^/]+/i, "");
}

function ensureLeadingSlash(value: string) {
  return value.startsWith("/") ? value : `/${value}`;
}

function isMpbHostname(hostname: string) {
  return hostname === MPB_HOSTNAME;
}
