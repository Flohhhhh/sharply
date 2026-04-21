import type { JSX } from "react";
import { Suspense } from "react";
import type { Metadata } from "next";
import {
  buildSeo,
  fetchBrowseListPage,
  resolveScopeOrThrow,
} from "~/server/gear/browse/service";
import { BRANDS, MOUNTS } from "~/lib/constants";
import AllGearContent from "../_components/all-gear-content";
import BrandContent from "../_components/brand-content";
import MountButtons from "../_components/mount-buttons";
import Breadcrumbs from "../_components/breadcrumbs";
import { GearCardSkeleton } from "~/components/gear/gear-card";
import { getMountDisplayName } from "~/lib/mapping/mounts-map";
import { BrowseResultsGrid } from "../_components/browse-results-grid";
import { BrowseQueryControls } from "../_components/browse-query-controls";
import { fetchTrendingSlugs } from "~/server/popularity/service";
import { env } from "~/env";
import { buildLocalizedMetadata } from "~/lib/seo/metadata";
import { getTranslations } from "next-intl/server";

export const dynamicParams = true;

export async function generateStaticParams() {
  if (env.SKIP_BUILD_STATIC_GENERATION) {
    return [];
  }

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
}: {
  params: Promise<{ segments?: string[] }>;
}): Promise<Metadata> {
  const { segments = [] } = await params;
  const meta = await buildSeo({ segments });
  const pathname =
    segments.length > 0 ? `/browse/${segments.join("/")}` : "/browse";
  return buildLocalizedMetadata(pathname, {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: meta.canonical },
    openGraph: meta.openGraph,
  });
}

export const revalidate = 3600;
const BROWSE_PAGE_SKELETON_KEYS = Array.from(
  { length: 12 },
  (_, index) => `browse-page-skeleton-${index + 1}`,
);

export default async function BrowseCatchAll({
  params,
}: {
  params: Promise<{ segments?: string[] }>;
}) {
  const t = await getTranslations("browsePage");
  const { segments = [] } = await params;
  const { depth, scope, brand, mount } = await resolveScopeOrThrow(segments);

  if (depth === 0) {
    return (
      <main className="space-y-6 pb-24">
        <AllGearContent />
      </main>
    );
  }

  if (depth === 1) {
    return (
      <main className="space-y-6 pb-24">
        <Breadcrumbs brand={{ name: brand!.name, slug: brand!.slug }} />
        <h1 className="text-3xl font-semibold">{brand!.name}</h1>
        <BrandContent brandSlug={brand!.slug} />
      </main>
    );
  }

  const initialPage = await fetchBrowseListPage({
    segments,
    searchParams: {},
  });

  if (depth === 2) {
    const trendingSlugs = await fetchTrendingSlugs({
      timeframe: "30d",
      limit: 20,
      filters: { brandId: brand!.id },
    });
    return (
      <main className="space-y-6 pb-24">
        <Breadcrumbs
          brand={{ name: brand!.name, slug: brand!.slug }}
          category={scope.categorySlug!}
        />
        <h1 className="text-3xl font-semibold">
          {brand!.name} {scope.categorySlug === "cameras" ? t("cameras") : t("lenses")}
        </h1>
        <MountButtons
          brandId={brand!.id}
          brandSlug={brand!.slug}
          category={scope.categorySlug!}
        />
        <Suspense fallback={<SortSelectFallback label={t("sortBy")} />}>
          <BrowseQueryControls category={scope.categorySlug} hasMount={false} />
        </Suspense>
        <Suspense fallback={<BrowseResultsLoading label={t("loadingResults")} />}>
          <BrowseResultsGrid
            initialPage={initialPage}
            brandName={brand!.name}
            scope={scope}
            trendingSlugs={trendingSlugs}
          />
        </Suspense>
      </main>
    );
  }

  const trendingSlugs = await fetchTrendingSlugs({
    timeframe: "30d",
    limit: 20,
    filters: { brandId: brand!.id },
  });

  return (
    <main className="space-y-6 pb-24">
      <Breadcrumbs
        brand={{ name: brand!.name, slug: brand!.slug }}
        category={scope.categorySlug!}
        mountValue={mount?.value ?? null}
      />
      <h1 className="text-3xl font-semibold">
        {brand!.name} {t("mountLabel", { mount: getMountDisplayName(mount?.value) })}{" "}
        {scope.categorySlug === "cameras" ? t("cameras") : t("lenses")}
      </h1>
      <Suspense fallback={<SortSelectFallback label={t("sortBy")} />}>
        <BrowseQueryControls category={scope.categorySlug} hasMount={!!mount} />
      </Suspense>
      <Suspense fallback={<BrowseResultsLoading label={t("loadingResults")} />}>
        <BrowseResultsGrid
          initialPage={initialPage}
          brandName={brand!.name}
          scope={scope}
          trendingSlugs={trendingSlugs}
        />
      </Suspense>
    </main>
  );
}

function SortSelectFallback({
  label,
}: {
  label: string;
}): JSX.Element {
  return (
    <div className="mb-2 flex items-center justify-end gap-2">
      <div className="border-input text-muted-foreground inline-flex h-10 w-[200px] items-center rounded-md border px-3 text-sm">
        {label}
      </div>
    </div>
  );
}

function BrowseResultsLoading({
  label,
}: {
  label: string;
}): JSX.Element {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">{label}</p>
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 lg:grid-cols-3">
        {BROWSE_PAGE_SKELETON_KEYS.map((key) => (
          <GearCardSkeleton key={key} />
        ))}
      </div>
    </div>
  );
}
