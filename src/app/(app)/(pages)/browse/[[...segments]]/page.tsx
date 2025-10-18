import type { Metadata } from "next";
import { loadHubData, buildSeo } from "~/server/gear/browse/service";
import { BRANDS, MOUNTS } from "~/lib/constants";
import AllGearContent from "../_components/all-gear-content";
import BrandContent from "../_components/brand-content";
import { GearCard } from "~/components/gear/gear-card";
import { FiltersModal } from "~/components/search/filters-modal";
import { FilterPills } from "~/components/search/filter-pills";
import { SortSelect } from "~/components/search/sort-select";
import MountButtons from "../_components/mount-buttons";
import Breadcrumbs from "../_components/breadcrumbs";

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
  const { depth, scope, brand, mount, lists } = await loadHubData({
    segments,
    searchParams: sp,
  });

  if (depth === 0) {
    return (
      <main>
        <AllGearContent />
      </main>
    );
  }

  if (depth === 1) {
    return (
      <main className="space-y-6">
        <Breadcrumbs brand={{ name: brand!.name, slug: brand!.slug }} />
        <h1 className="text-3xl font-semibold">{brand!.name}</h1>
        <BrandContent brandSlug={brand!.slug} />
      </main>
    );
  }

  if (depth === 2) {
    return (
      <main className="space-y-6">
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
          <SortSelect />
          <FiltersModal />
        </div>
        <div className="mb-2">
          <FilterPills />
        </div>
        <p className="text-muted-foreground text-sm">
          Showing {lists.total} result{lists.total === 1 ? "" : "s"}
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {lists.items.map((g: any) => (
            <GearCard
              key={g.id}
              href={`/gear/${g.slug}`}
              slug={g.slug}
              name={g.name}
              brandName={undefined}
              thumbnailUrl={g.thumbnailUrl}
              gearType={g.gearType}
              dateText={
                g.releaseDate
                  ? `Released ${new Date(g.releaseDate).getFullYear()}`
                  : null
              }
            />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <Breadcrumbs
        brand={{ name: brand!.name, slug: brand!.slug }}
        category={scope.categorySlug!}
        mountShort={mount?.shortName ?? null}
      />
      <h1 className="text-3xl font-semibold">
        {brand!.name} {mount?.shortName?.toUpperCase()} Mount{" "}
        {scope.categorySlug === "cameras" ? "Cameras" : "Lenses"}
      </h1>
      <div className="mb-2 flex items-center justify-end gap-2">
        <SortSelect />
        <FiltersModal />
      </div>
      <div className="mb-2">
        <FilterPills />
      </div>
      <p className="text-muted-foreground text-sm">
        Showing {lists.total} result{lists.total === 1 ? "" : "s"}
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {lists.items.map((g: any) => (
          <GearCard
            key={g.id}
            href={`/gear/${g.slug}`}
            slug={g.slug}
            name={g.name}
            brandName={undefined}
            thumbnailUrl={g.thumbnailUrl}
            gearType={g.gearType}
            dateText={
              g.releaseDate
                ? `Released ${new Date(g.releaseDate).getFullYear()}`
                : null
            }
          />
        ))}
      </div>
    </main>
  );
}
