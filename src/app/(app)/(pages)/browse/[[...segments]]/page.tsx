import type { Metadata } from "next";
import { loadHubData, buildSeo } from "~/server/gear/browse/service";
import { BRANDS, MOUNTS } from "~/lib/constants";
import AllGearContent from "../_components/all-gear-content";
import BrandContent from "../_components/brand-content";
import { SortSelect } from "~/components/search/sort-select";
import MountButtons from "../_components/mount-buttons";
import Breadcrumbs from "../_components/breadcrumbs";
import { getMountDisplayName } from "~/lib/mapping/mounts-map";
import {
  BrowseResultsGrid,
  type BrowseListPage,
} from "../_components/browse-results-grid";
import type { BrowseFilters } from "~/lib/browse/filters";
import type { SearchGearResult } from "~/server/gear/browse/data";

export const dynamicParams = true;

export async function generateStaticParams() {
  console.log("[/browse] generateStaticParams running");
  const all: { segments: string[] }[] = [{ segments: [] }];
  const categories: Array<"cameras" | "lenses"> = ["cameras", "lenses"];

  for (const b of BRANDS) {
    all.push({ segments: [b.slug] });
    for (const c of categories) {
      all.push({ segments: [b.slug, c] });
      const brandMounts = MOUNTS.filter(
        (m) => m.brand_id === b.id && !!m.short_name,
      );
      for (const m of brandMounts) {
        all.push({ segments: [b.slug, c, String(m.short_name)] });
      }
    }
  }

  return all;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ segments?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { segments = [] } = await params;
  const sp = await searchParams;
  const meta = await buildSeo({ segments, searchParams: sp });
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: meta.canonical },
    openGraph: meta.openGraph,
  };
}

export const revalidate = 3600;

export default async function BrowseCatchAll({
  params,
  searchParams,
}: {
  params: Promise<{ segments?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { segments = [] } = await params;
  const sp = await searchParams;
  // console.log("[/browse] Generating static page (build/ISR)", { segments, sp });
  const { depth, scope, brand, mount, lists, filters } = await loadHubData({
    segments,
    searchParams: sp,
  });

  if (depth === 0) {
    const initialPage = buildInitialPage(lists, filters);
    const baseQuery = buildBaseQuery({
      searchParams: sp,
      perPage: filters.perPage,
      brandSlug: brand?.slug ?? undefined,
      category: null,
    });
    return (
      <main className="space-y-6 pb-24">
        <AllGearContent
          initialBrowsePage={initialPage}
          browseBaseQuery={baseQuery}
          brandName={brand?.name ?? undefined}
        />
      </main>
    );
  }

  if (depth === 1) {
    return (
      <main className="space-y-6 pb-24">
        <Breadcrumbs brand={{ name: brand!.name, slug: brand!.slug }} />
        <h1 className="text-3xl font-semibold">{brand!.name}</h1>
        <BrandContent
          brandSlug={brand!.slug}
          initialBrowsePage={buildInitialPage(lists, filters)}
          browseBaseQuery={buildBaseQuery({
            searchParams: sp,
            perPage: filters.perPage,
            brandSlug: brand!.slug,
            category: null,
          })}
          brandName={brand!.name}
        />
      </main>
    );
  }

  if (depth === 2) {
    const initialPage = buildInitialPage(lists, filters);
    const baseQuery = buildBaseQuery({
      searchParams: sp,
      perPage: filters.perPage,
      brandSlug: brand!.slug,
      category: scope.categorySlug,
    });
    return (
      <main className="space-y-6 pb-24">
        <Breadcrumbs
          brand={{ name: brand!.name, slug: brand!.slug }}
          category={scope.categorySlug!}
        />
        <h1 className="text-3xl font-semibold">
          {brand!.name}{" "}
          {scope.categorySlug === "cameras" ? "Cameras" : "Lenses"}
        </h1>
        <MountButtons
          brandId={brand!.id}
          brandSlug={brand!.slug}
          category={scope.categorySlug!}
        />
        <div className="mb-2 flex items-center justify-end gap-2">
          <SortSelect category={scope.categorySlug} hasMount={false} />
        </div>
        <p className="text-muted-foreground text-sm">
          Showing {lists.total} result{lists.total === 1 ? "" : "s"}
        </p>
        <BrowseResultsGrid
          initialPage={initialPage}
          brandName={brand!.name}
          baseQuery={baseQuery}
        />
      </main>
    );
  }

  return (
    <main className="space-y-6 pb-24">
      <Breadcrumbs
        brand={{ name: brand!.name, slug: brand!.slug }}
        category={scope.categorySlug!}
        mountValue={mount?.value ?? null}
      />
      <h1 className="text-3xl font-semibold">
        {brand!.name} {getMountDisplayName(mount?.value)} Mount{" "}
        {scope.categorySlug === "cameras" ? "Cameras" : "Lenses"}
      </h1>
      <div className="mb-2 flex items-center justify-end gap-2">
        <SortSelect category={scope.categorySlug} hasMount={!!mount} />
      </div>
      <p className="text-muted-foreground text-sm">
        Showing {lists.total} result{lists.total === 1 ? "" : "s"}
      </p>
      <BrowseResultsGrid
        initialPage={buildInitialPage(lists, filters)}
        brandName={brand!.name}
        baseQuery={buildBaseQuery({
          searchParams: sp,
          perPage: filters.perPage,
          brandSlug: brand!.slug,
          category: scope.categorySlug,
          mountShort: mount?.shortName ?? null,
        })}
      />
    </main>
  );
}

function buildInitialPage(
  lists: SearchGearResult,
  filters: BrowseFilters,
): BrowseListPage {
  return {
    items: lists.items.map((g) => ({
      ...g,
      releaseDate: g.releaseDate ? g.releaseDate.toISOString() : null,
      thumbnailUrl: g.thumbnailUrl ?? null,
      brandName: g.brandName ?? null,
      gearType: g.gearType ?? null,
      msrpNowUsdCents:
        typeof g.msrpNowUsdCents === "number" ? g.msrpNowUsdCents : null,
      mpbMaxPriceUsdCents:
        typeof g.mpbMaxPriceUsdCents === "number"
          ? g.mpbMaxPriceUsdCents
          : null,
    })),
    total: lists.total,
    page: filters.page,
    perPage: filters.perPage,
    hasMore: filters.page * filters.perPage < lists.total,
  };
}

function buildBaseQuery(params: {
  searchParams: Record<string, string | string[] | undefined>;
  perPage: number;
  brandSlug?: string;
  category?: string | null;
  mountShort?: string | null;
}) {
  const qs = new URLSearchParams();
  qs.set("view", "list");
  if (params.brandSlug) qs.set("brandSlug", params.brandSlug);
  if (params.category) qs.set("category", params.category);
  if (params.mountShort) qs.set("mount", params.mountShort);
  qs.set("perPage", String(params.perPage));

  Object.entries(params.searchParams).forEach(([key, value]) => {
    if (key === "page" || key === "perPage") return;
    if (value == null) return;
    if (Array.isArray(value)) value.forEach((v) => qs.append(key, v));
    else qs.set(key, value);
  });

  return qs.toString();
}
