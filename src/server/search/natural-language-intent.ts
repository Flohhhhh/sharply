import { BRANDS, MOUNTS } from "~/lib/constants";
import { getMountDisplayName, getMountLongName } from "~/lib/mapping/mounts-map";
import type {
  GearSuggestion,
  ParsedSearchFilters,
  ParsedSearchIntentKind,
} from "~/types/search";

type BrandConst = {
  id: string;
  name: string;
  slug: string;
};

type MountConst = {
  value: string;
  short_name?: string | null;
  brand_id?: string | null;
};

type ResolvedMount = {
  value: string;
  label: string;
  shortLabel: string;
  brandSlug?: string;
  brandLabel?: string;
};

type ParsedSearchIntent = {
  kind: ParsedSearchIntentKind;
  subject: string;
  filters: ParsedSearchFilters;
};

type ResolveCameraMatch = (
  query: string,
) => Promise<(GearSuggestion & { mountValue?: string | null }) | null>;

const BRAND_LIST = BRANDS as BrandConst[];
const MOUNT_LIST = MOUNTS as MountConst[];

const LENSES_FOR_RE = /^lenses?\s+for\s+(.+)$/i;
const LENS_QUERY_RE = /^(.+?)\s+lenses?(?:\s+(.+))?$/i;
const CAMERA_QUERY_RE = /^(.+?)\s+cameras?(?:\s+(.+))?$/i;

function normalizeToken(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizeWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function trimEdgePunctuation(value: string) {
  return value.replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, "");
}

function buildBrandLookup() {
  const byToken = new Map<string, BrandConst[]>();

  for (const brand of BRAND_LIST) {
    for (const candidate of [brand.name, brand.slug]) {
      const token = normalizeToken(candidate);
      if (!token) continue;
      byToken.set(token, [...(byToken.get(token) ?? []), brand]);
    }
  }

  return byToken;
}

function buildMountLookup() {
  const byToken = new Map<string, ResolvedMount[]>();
  const brandsById = new Map(BRAND_LIST.map((brand) => [brand.id, brand]));

  for (const mount of MOUNT_LIST) {
    const brand = mount.brand_id ? brandsById.get(mount.brand_id) : undefined;
    const brandSlug = brand?.slug;
    const shortLabel = getMountDisplayName(mount.value);
    const longLabel = getMountLongName(mount.value);
    const resolvedMount: ResolvedMount = {
      value: mount.value,
      label: longLabel,
      shortLabel,
      ...(brandSlug ? { brandSlug } : {}),
      ...(brand ? { brandLabel: brand.name } : {}),
    };
    const candidates = new Set<string>([
      mount.value,
      longLabel,
      shortLabel,
      mount.short_name ?? "",
      brand ? `${brand.name} ${shortLabel}` : "",
      brand ? `${shortLabel} ${brand.name}` : "",
    ]);

    for (const candidate of candidates) {
      const token = normalizeToken(candidate);
      if (!token) continue;
      byToken.set(token, [...(byToken.get(token) ?? []), resolvedMount]);
    }
  }

  return byToken;
}

const brandLookup = buildBrandLookup();
const mountLookup = buildMountLookup();

function resolveBrand(subject: string) {
  const matches =
    brandLookup.get(normalizeToken(trimEdgePunctuation(subject))) ?? [];
  const uniqueMatches = Array.from(
    new Map(matches.map((brand) => [brand.slug, brand])).values(),
  );
  if (uniqueMatches.length !== 1) return null;
  const brand = uniqueMatches[0]!;
  return { slug: brand.slug, label: brand.name };
}

function resolveMount(subject: string) {
  const matches =
    mountLookup.get(normalizeToken(trimEdgePunctuation(subject))) ?? [];
  const unique = Array.from(
    new Map(matches.map((match) => [match.value, match])).values(),
  );
  if (unique.length !== 1) return null;
  return unique[0]!;
}

function resolveBrandMount(subject: string) {
  const cleanedSubject = normalizeWhitespace(trimEdgePunctuation(subject));
  const tokens = cleanedSubject.split(" ").filter(Boolean);

  if (tokens.length < 2) return null;

  for (let brandLength = tokens.length - 1; brandLength >= 1; brandLength -= 1) {
    const brandCandidate = tokens.slice(0, brandLength).join(" ");
    const mountCandidate = tokens.slice(brandLength).join(" ");
    const brand = resolveBrand(brandCandidate);
    const mount = resolveMount(mountCandidate);

    if (!brand || !mount) continue;
    if (mount.brandSlug && mount.brandSlug !== brand.slug) continue;

    return {
      brand,
      mount,
      subject: `${brand.label} ${mount.shortLabel}`,
    };
  }

  return null;
}

async function parseLensesForCamera(
  query: string,
  resolveCameraMatch: ResolveCameraMatch,
): Promise<ParsedSearchIntent | null> {
  const match = query.match(LENSES_FOR_RE);
  if (!match) return null;

  const rawTail = normalizeWhitespace(match[1] ?? "");
  if (!rawTail) return null;

  const tokens = rawTail.split(" ");
  for (let length = tokens.length; length >= 1; length -= 1) {
    const cameraCandidate = tokens.slice(0, length).join(" ");
    const remainder = normalizeWhitespace(tokens.slice(length).join(" "));
    const cameraMatch = await resolveCameraMatch(cameraCandidate);
    if (!cameraMatch?.mountValue) continue;

    return {
      kind: "lenses-for-camera",
      subject: cameraMatch.title,
      filters: {
        gearType: "LENS",
        mount: cameraMatch.mountValue,
        ...(remainder ? { q: remainder } : {}),
      },
    };
  }

  return null;
}

function parseBrandOrMountQuery(
  query: string,
  kind: "lens" | "camera",
): ParsedSearchIntent | null {
  const match = query.match(kind === "lens" ? LENS_QUERY_RE : CAMERA_QUERY_RE);
  if (!match) return null;

  const rawSubject = normalizeWhitespace(trimEdgePunctuation(match[1] ?? ""));
  const remainder = normalizeWhitespace(match[2] ?? "");
  if (!rawSubject) return null;

  const resolvedBrandMount = resolveBrandMount(rawSubject);
  if (resolvedBrandMount) {
    return {
      kind: kind === "lens" ? "mount-lenses" : "mount-cameras",
      subject: resolvedBrandMount.subject,
      filters: {
        gearType: kind === "lens" ? "LENS" : "CAMERA",
        brand: resolvedBrandMount.brand.slug,
        mount: resolvedBrandMount.mount.value,
        ...(remainder ? { q: remainder } : {}),
      },
    };
  }

  const mountMatch = rawSubject.match(/^(.*?)\s+mount$/i);
  if (mountMatch) {
    const resolvedMount = resolveMount(mountMatch[1] ?? "");
    if (!resolvedMount) return null;

    return {
      kind: kind === "lens" ? "mount-lenses" : "mount-cameras",
      subject:
        resolvedMount.brandLabel && resolvedMount.shortLabel
          ? `${resolvedMount.brandLabel} ${resolvedMount.shortLabel}`
          : resolvedMount.label,
      filters: {
        gearType: kind === "lens" ? "LENS" : "CAMERA",
        mount: resolvedMount.value,
        ...(remainder ? { q: remainder } : {}),
      },
    };
  }

  const resolvedBrand = resolveBrand(rawSubject);
  if (!resolvedBrand) return null;

  return {
    kind: kind === "lens" ? "brand-lenses" : "brand-cameras",
    subject: resolvedBrand.label,
    filters: {
      gearType: kind === "lens" ? "LENS" : "CAMERA",
      brand: resolvedBrand.slug,
      ...(remainder ? { q: remainder } : {}),
    },
  };
}

export async function parseNaturalLanguageSearchIntent(
  query: string,
  resolveCameraMatch: ResolveCameraMatch,
): Promise<ParsedSearchIntent | null> {
  const normalizedQuery = normalizeWhitespace(query);
  if (!normalizedQuery) return null;

  return (
    (await parseLensesForCamera(normalizedQuery, resolveCameraMatch)) ??
    parseBrandOrMountQuery(normalizedQuery, "lens") ??
    parseBrandOrMountQuery(normalizedQuery, "camera")
  );
}
