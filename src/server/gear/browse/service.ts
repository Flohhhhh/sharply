import "server-only";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import {
  parseSegments,
  type RouteScope,
  getDepth,
  formatScopeTitle,
} from "~/lib/browse/routing";
import {
  parseFilters,
  type BrowseFilters,
  type SortOption,
} from "~/lib/browse/filters";
// Category labels are defined locally to avoid a separate constants module
const gearCategoryLabels = {
  cameras: "Cameras",
  lenses: "Lenses",
} as const;

type LoadHubDataResult = {
  depth: 0 | 1 | 2 | 3;
  scope: RouteScope;
  brand?: { id: string; name: string; slug: string } | null;
  mount?: { id: string; shortName: string | null; value: string } | null;
  lists: SearchGearResult;
  filters: BrowseFilters;
};
import {
  getBrandBySlug,
  getMountByShortName,
  searchGear,
  getReleaseOrderedGearPage,
} from "./data";
import type { SearchGearResult } from "./data";
import { LENS_FOCAL_LENGTH_SORT } from "./lens-sort";
import type { BrowseFeedPage } from "~/types/browse";

export async function deriveDefaultBrandFromCookies() {
  const store = await cookies();
  const slug = store.get("brand_affinity")?.value;
  return slug ?? null;
}

export async function resolveScopeOrThrow(segments: string[]): Promise<{
  depth: 0 | 1 | 2 | 3;
  scope: RouteScope;
  brand?: { id: string; name: string; slug: string } | null;
  mount?: { id: string; shortName: string | null; value: string } | null;
}> {
  const scope = parseSegments(segments);
  const depth = getDepth(scope);
  let brand: { id: string; name: string; slug: string } | null = null;
  let mount: { id: string; shortName: string | null; value: string } | null =
    null;

  if (scope.brandSlug) {
    brand = await getBrandBySlug(scope.brandSlug);
    if (!brand) notFound();
  }
  if (scope.mountShort) {
    if (!brand) notFound();
    const m = await getMountByShortName(scope.mountShort, brand.id);
    if (!m) notFound();
    mount = { id: m.id, shortName: m.shortName, value: m.value };
  }
  return { depth, scope, brand, mount };
}

export async function loadHubData(params: {
  segments: string[];
  searchParams: Record<string, string | string[] | undefined>;
}): Promise<LoadHubDataResult> {
  const { depth, scope, brand, mount } = await resolveScopeOrThrow(
    params.segments,
  );
  const defaultSort = getDefaultSortForScope(scope);
  const isLensMountScope =
    scope.categorySlug === "lenses" && !!scope.mountShort;
  const filters = (() => {
    const base = parseFilters(params.searchParams, { defaultSort });
    if (isLensMountScope) {
      // Lens + mount pages are narrow enough to return all items in one request.
      return { ...base, perPage: 500, page: 1 };
    }
    return base;
  })();

  const cookieSlug = await deriveDefaultBrandFromCookies();
  const effectiveBrandSlug =
    scope.brandSlug ?? filters.brandOverride ?? cookieSlug ?? undefined;
  const effectiveBrand = scope.brandSlug
    ? brand
    : effectiveBrandSlug
      ? await getBrandBySlug(effectiveBrandSlug)
      : null;

  if (depth === 0) {
    const lists = effectiveBrand
      ? await searchGear({ brandId: effectiveBrand.id, filters })
      : await searchGear({ filters });
    return { depth, scope, brand: effectiveBrand, lists, filters };
  }

  if (depth === 1) {
    const lists = await searchGear({ brandId: brand!.id, filters });
    return { depth, scope, brand, lists, filters };
  }

  if (depth === 2) {
    const lists = await searchGear({
      brandId: brand!.id,
      category: scope.categorySlug!,
      filters,
    });
    return { depth, scope, brand, lists, filters };
  }

  const mountInfo = mount!;
  const lists = await searchGear({
    brandId: brand!.id,
    category: scope.categorySlug!,
    mountId: mountInfo.id,
    filters,
  });
  return { depth, scope, brand, mount: mountInfo, lists, filters };
}

export async function buildSeo(params: {
  segments: string[];
  searchParams: Record<string, string | string[] | undefined>;
}) {
  console.log("[/browse] buildSeo running", { segments: params.segments });
  // Load data once to obtain scope + total for descriptive metadata
  const { scope, brand, mount, lists } = await loadHubData({
    segments: params.segments,
    searchParams: params.searchParams,
  });

  // Special-case the browse index for clearer SEO
  if (!scope.brandSlug && !scope.categorySlug && !scope.mountShort) {
    const base = process.env.NEXT_PUBLIC_BASE_URL!;
    const title = "All Gear";
    const description =
      "Explore the latest and trending cameras and lenses from Canon, Nikon, Sony, and more, as well as curated lists of gear.";
    const canonical = `${base}/browse`;
    const openGraph = { title, description, url: canonical };
    return { title, description, canonical, openGraph };
  }

  const plainTitle = formatScopeTitle({
    brandName: brand?.name ?? null,
    category: scope.categorySlug ?? null,
    mountValue: mount?.value ?? null,
  });
  const title = `${plainTitle}`;
  const description = `Explore all ${lists.total} ${plainTitle}`;
  const canonical = buildCanonical(
    scope,
    parseFilters(params.searchParams, {
      defaultSort: getDefaultSortForScope(scope),
    }),
  );
  const openGraph = { title, description, url: canonical };
  return { title, description, canonical, openGraph };
}

function buildCanonical(scope: RouteScope, _filters: BrowseFilters) {
  const base = process.env.NEXT_PUBLIC_BASE_URL!;
  const segs: string[] = ["browse"];
  if (scope.brandSlug) segs.push(scope.brandSlug);
  if (scope.categorySlug) segs.push(scope.categorySlug);
  if (scope.mountShort) segs.push(scope.mountShort);
  return `${base}/${segs.join("/")}`;
}

function getDefaultSortForScope(scope: RouteScope): SortOption {
  if (scope.categorySlug === "lenses" && scope.mountShort) {
    return LENS_FOCAL_LENGTH_SORT;
  }
  return "newest";
}

// Deprecated: static params are generated directly in the page route

const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 60;

export async function fetchReleaseFeedPage(params: {
  limit?: number;
  brandSlug?: string;
  offset?: number;
}): Promise<BrowseFeedPage> {
  const limit = Math.max(
    1,
    Math.min(Math.floor(params.limit ?? DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE),
  );
  const offset = Math.max(0, Math.floor(params.offset ?? 0));

  const page = await getReleaseOrderedGearPage({
    limit,
    brandSlug: params.brandSlug,
    offset,
  });

  const items = page.items.map((item) => ({
    ...item,
    releaseDate: item.releaseDate ? item.releaseDate.toISOString() : null,
    releaseDatePrecision: item.releaseDatePrecision ?? null,
    announcedDate: item.announcedDate ? item.announcedDate.toISOString() : null,
    announcedDatePrecision: item.announcedDatePrecision ?? null,
    brandName: item.brandName ?? null,
    thumbnailUrl: item.thumbnailUrl ?? null,
    gearType: item.gearType ?? null,
    msrpNowUsdCents:
      typeof item.msrpNowUsdCents === "number" ? item.msrpNowUsdCents : null,
    mpbMaxPriceUsdCents:
      typeof item.mpbMaxPriceUsdCents === "number"
        ? item.mpbMaxPriceUsdCents
        : null,
  }));

  const nextCursor = page.hasMore
    ? {
        offset: offset + limit,
      }
    : null;

  return {
    items,
    nextCursor,
    hasMore: page.hasMore,
  };
}
