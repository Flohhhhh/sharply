import { MOUNTS } from "~/lib/constants";

export type Market = "US" | "UK" | "EU";

const MPB_HOSTNAME = "www.mpb.com";

const MPB_MARKET_PATH_SEGMENT: Record<Market, string> = {
  US: "en-us",
  UK: "en-uk",
  EU: "en-eu",
};

export const MPB_MOUNT_PATHS_MAP: Record<string, string> = {
  "ef-canon": "-canon-fit",
  "rf-canon": "-canon-rf-fit",
  "ef-m-canon": "-canon-ef-m-fit",
  "fl-canon": "-canon-fl-fit",
  "fd-canon": "-canon-fd-fit",
  "f-nikon": "-nikon-fit",
  "z-nikon": "-nikon-z-fit",
  "nikon1-nikon": "-nikon-1-fit",
  "e-sony": "-sony-e-fit",
  "a-sony": "-sony-a-fit",
  "l-leica": "-l-fit",
  "m-leica": "-leica-m-fit",
  "ltm-leica": "-leica-ltm-fit",
  "s-leica": "-leica-s-fit",
  "m43-panasonic": "-micro-four-thirds-fit",
  "43-olympus": "-four-thirds-fit",
  "x-fujifilm": "-fujifilm-x-fit",
  "g-fujifilm": "-fujifilm-g-fit",
  "k-pentax": "-pentax-k-fit",
  "q-pentax": "-pentax-q-fit",
  "x-hasselblad": "-hasselblad-x-fit",
  "h-hasselblad": "-hasselblad-h-fit",
  "v-hasselblad": "-hasselblad-v-fit",
  "sa-sigma": "-sigma-sa-fit",
};

const MOUNT_VALUE_BY_ID = new Map(
  (MOUNTS as Array<{ id: string; value: string }>).map((mount) => [
    mount.id,
    mount.value,
  ]),
);

const MPB_KNOWN_MOUNT_SUFFIXES = Array.from(
  new Set([...Object.values(MPB_MOUNT_PATHS_MAP), "-sony-fe-fit"]),
).sort((a, b) => b.length - a.length);

export type NormalizeMpbLinkResult =
  | { kind: "empty"; normalizedPath: null }
  | {
      kind: "product";
      normalizedPath: string;
      originalPath: string;
      wasNormalized: boolean;
    }
  | { kind: "search"; originalPath: string }
  | { kind: "invalid"; originalPath: string };

interface GetMpbDestinationUrlInput {
  market: Market;
  destinationPath: string;
  mountId?: string | null;
}

/**
 * Build a direct MPB destination URL using the requested storefront path prefix.
 */
export function getMpbDestinationUrl(input: GetMpbDestinationUrlInput) {
  return buildDestinationAddress(
    input.destinationPath,
    input.market,
    input.mountId ?? null,
  );
}

export function normalizeMpbLinkInput(
  input?: string | null,
): NormalizeMpbLinkResult {
  const trimmed = (input ?? "").trim();

  if (!trimmed) {
    return { kind: "empty", normalizedPath: null };
  }

  const parsed = parseMpbInput(trimmed);
  if (!parsed) {
    return { kind: "invalid", originalPath: trimmed };
  }

  if (parsed.kind === "absolute" && !isMpbHostname(parsed.url.hostname)) {
    return { kind: "invalid", originalPath: trimmed };
  }

  const originalPath = stripMarketSegmentFromPath(parsed.url.pathname);
  if (isMpbSearchPath(parsed.url.pathname)) {
    return {
      kind: "search",
      originalPath: withSearch(originalPath, parsed.url),
    };
  }
  if (!isMpbProductPath(originalPath)) {
    return { kind: "invalid", originalPath };
  }

  const normalizedPath = stripKnownMountSuffixFromPath(originalPath);

  return {
    kind: "product",
    normalizedPath,
    originalPath,
    wasNormalized: normalizedPath !== originalPath,
  };
}

export function normalizeMpbLinkForStorage(
  input?: string | null,
): string | null {
  const result = normalizeMpbLinkInput(input);

  if (result.kind === "empty") return null;
  if (result.kind === "product") return result.normalizedPath;
  if (result.kind === "search") {
    throw new Error(
      "MPB search URLs are no longer supported. Paste a product link instead.",
    );
  }

  throw new Error("Invalid MPB URL.");
}

export function getMpbMountSuffix(mountId?: string | null): string | null {
  if (!mountId) return null;
  const mountValue = MOUNT_VALUE_BY_ID.get(mountId);
  if (!mountValue) return null;
  return MPB_MOUNT_PATHS_MAP[mountValue] ?? null;
}

export function hasKnownMpbMountSuffix(
  destinationPath?: string | null,
): boolean {
  const result = normalizeMpbLinkInput(destinationPath);
  return result.kind === "product" && result.wasNormalized;
}

export function buildMpbPathForMount(
  destinationPath: string,
  mountId?: string | null,
): string | null {
  const result = normalizeMpbLinkInput(destinationPath);
  if (result.kind !== "product") return null;
  if (!mountId) return result.originalPath;

  const suffix = getMpbMountSuffix(mountId);
  if (!suffix) return null;

  return appendMountSuffixToPath(result.normalizedPath, suffix);
}

export function isMpbSearchInput(input?: string | null) {
  return normalizeMpbLinkInput(input).kind === "search";
}

function buildDestinationAddress(
  destinationPath: string,
  market: Market,
  mountId: string | null,
) {
  const cleanedDestinationPath = destinationPath.trim();

  if (cleanedDestinationPath === "") {
    throw new Error("Destination path cannot be empty when building MPB link.");
  }

  if (isHttpAddress(cleanedDestinationPath)) {
    return buildDestinationAddressFromAbsolute(
      cleanedDestinationPath,
      market,
      mountId,
    );
  }

  return buildDestinationAddressFromRelative(
    cleanedDestinationPath,
    market,
    mountId,
  );
}

function buildDestinationAddressFromAbsolute(
  address: string,
  market: Market,
  mountId: string | null,
) {
  const parsedAddress = new URL(address);
  if (!isMpbHostname(parsedAddress.hostname)) {
    throw new Error("MPB destination must use an MPB hostname.");
  }

  parsedAddress.protocol = "https:";
  parsedAddress.hostname = MPB_HOSTNAME;
  parsedAddress.port = "";
  parsedAddress.pathname = buildMarketPath(
    parsedAddress.pathname,
    market,
    mountId,
  );
  return parsedAddress.toString();
}

function buildDestinationAddressFromRelative(
  address: string,
  market: Market,
  mountId: string | null,
) {
  const parsedAddress = new URL(
    ensureLeadingSlash(address),
    `https://${MPB_HOSTNAME}`,
  );
  parsedAddress.pathname = buildMarketPath(
    parsedAddress.pathname,
    market,
    mountId,
  );
  return parsedAddress.toString();
}

function buildMarketPath(
  pathname: string,
  market: Market,
  mountId: string | null,
) {
  const normalizedSegment = stripMarketSegmentFromPath(pathname);
  if (isMpbSearchPath(normalizedSegment)) {
    if (mountId) {
      throw new Error(
        "MPB search destinations do not support mount selection.",
      );
    }
    return `/${MPB_MARKET_PATH_SEGMENT[market]}${normalizedSegment}`;
  }
  if (!isMpbProductPath(normalizedSegment)) {
    throw new Error("MPB destination must be a product path.");
  }
  const mountedSegment = mountId
    ? buildMountedPathOrThrow(normalizedSegment, mountId)
    : normalizedSegment;
  return `/${MPB_MARKET_PATH_SEGMENT[market]}${mountedSegment}`;
}

function buildMountedPathOrThrow(pathname: string, mountId: string) {
  const mountedPath = buildMpbPathForMount(pathname, mountId);
  if (!mountedPath) {
    throw new Error("MPB destination mount is unsupported.");
  }
  return mountedPath;
}

function stripKnownMountSuffixFromPath(pathname: string) {
  const parts = stripMarketSegmentFromPath(pathname).split("/").filter(Boolean);
  if (parts.length === 0) return "/";

  const lastSegment = parts[parts.length - 1] ?? "";
  parts[parts.length - 1] = stripKnownMountSuffixFromSlug(lastSegment);
  return `/${parts.join("/")}`;
}

function stripKnownMountSuffixFromSlug(slug: string) {
  for (const suffix of MPB_KNOWN_MOUNT_SUFFIXES) {
    if (slug.toLowerCase().endsWith(suffix.toLowerCase())) {
      return slug.slice(0, -suffix.length);
    }
  }

  return slug;
}

function appendMountSuffixToPath(pathname: string, suffix: string) {
  const parts = stripMarketSegmentFromPath(pathname).split("/").filter(Boolean);
  if (parts.length === 0) {
    throw new Error("MPB destination path must include a product slug.");
  }

  parts[parts.length - 1] = `${parts[parts.length - 1]}${suffix}`;
  return `/${parts.join("/")}`;
}

function parseMpbInput(value: string) {
  if (
    isHttpAddress(value) ||
    /^www\./i.test(value) ||
    /^mpb\.com/i.test(value)
  ) {
    try {
      const withScheme = isHttpAddress(value) ? value : `https://${value}`;
      return { kind: "absolute" as const, url: new URL(withScheme) };
    } catch {
      return null;
    }
  }

  try {
    return {
      kind: "relative" as const,
      url: new URL(ensureLeadingSlash(value), `https://${MPB_HOSTNAME}`),
    };
  } catch {
    return null;
  }
}

function withSearch(pathname: string, url: URL) {
  return `${pathname}${url.search}`;
}

function isHttpAddress(value: string) {
  return value.startsWith("http://") || value.startsWith("https://");
}

function isMpbSearchPath(pathname: string) {
  return /^\/(?:en-[^/]+\/)?search(?:\/|$)/i.test(ensureLeadingSlash(pathname));
}

function isMpbProductPath(pathname: string) {
  const normalizedPath = stripMarketSegmentFromPath(pathname);
  return (
    /^\/product\/[^/]+\/?$/i.test(normalizedPath) ||
    /^\/buy\/used\/[^/]+\/?$/i.test(normalizedPath)
  );
}

function stripMarketSegmentFromPath(path: string) {
  const stripped = ensureLeadingSlash(path).replace(/^\/en-[^/]+/i, "");
  return stripped === "" ? "/" : stripped;
}

function ensureLeadingSlash(value: string) {
  return value.startsWith("/") ? value : `/${value}`;
}

function isMpbHostname(hostname: string) {
  const normalizedHostname = hostname.toLowerCase();
  return (
    normalizedHostname === MPB_HOSTNAME || normalizedHostname === "mpb.com"
  );
}
