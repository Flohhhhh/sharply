import "server-only";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import {
  parseSegments,
  type RouteScope,
  getDepth,
  formatScopeTitle,
} from "~/lib/browse/routing";
import { parseFilters, type BrowseFilters } from "~/lib/browse/filters";
// Category labels are defined locally to avoid a separate constants module
const gearCategoryLabels = {
  cameras: "Cameras",
  lenses: "Lenses",
} as const;
import { getBrandBySlug, getMountByShortName, searchGear } from "./data";

export async function deriveDefaultBrandFromCookies() {
  const store = await cookies();
  const slug = store.get("brand_affinity")?.value;
  return slug ?? null;
}

export async function resolveScopeOrThrow(segments: string[]): Promise<{
  depth: 0 | 1 | 2 | 3;
  scope: RouteScope;
  brand?: { id: string; name: string; slug: string } | null;
  mount?: { id: string; shortName: string | null } | null;
}> {
  const scope = parseSegments(segments);
  const depth = getDepth(scope);
  let brand: { id: string; name: string; slug: string } | null = null;
  let mount: { id: string; shortName: string | null } | null = null;

  if (scope.brandSlug) {
    brand = await getBrandBySlug(scope.brandSlug);
    if (!brand) notFound();
  }
  if (scope.mountShort) {
    if (!brand) notFound();
    const m = await getMountByShortName(scope.mountShort, brand!.id);
    if (!m) notFound();
    mount = { id: m.id, shortName: m.shortName };
  }
  return { depth, scope, brand, mount };
}

export async function loadHubData(params: {
  segments: string[];
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const { depth, scope, brand, mount } = await resolveScopeOrThrow(
    params.segments,
  );
  const filters = parseFilters(params.searchParams);

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
    mountShort: mount?.shortName ?? null,
  });
  const title = `${plainTitle}`;
  const description = `Explore all ${lists.total} ${plainTitle}`;
  const canonical = buildCanonical(scope, parseFilters(params.searchParams));
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

// Deprecated: static params are generated directly in the page route
