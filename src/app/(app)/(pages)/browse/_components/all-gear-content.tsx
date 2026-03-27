import { Suspense } from "react";
import { ClockIcon, FlameIcon, TrendingUpIcon } from "lucide-react";
import Link from "next/link";
import { GearCard, GearCardSkeleton } from "~/components/gear/gear-card";
import { Button } from "~/components/ui/button";
import { BRANDS } from "~/lib/constants";
import { splitBrandsWithPriority } from "~/lib/brands";
import { OtherBrandsSelect } from "./other-brands-select";
import { fetchTrending, fetchTrendingSlugs } from "~/server/popularity/service";
import { getItemDisplayPrice } from "~/lib/mapping";
import { fetchReleaseFeedPage } from "~/server/gear/browse/service";
import { ReleaseFeedGrid } from "./release-feed-grid";
import { getBrandBySlug } from "~/server/gear/browse/data";

const TRENDING_SKELETON_KEYS = [
  "trending-skeleton-1",
  "trending-skeleton-2",
  "trending-skeleton-3",
] as const;

export default async function AllGearContent({
  brandSlug,
  showBrandPicker = true,
}: {
  brandSlug?: string;
  showBrandPicker?: boolean;
} = {}) {
  // return <Loading />;
  const brand = brandSlug ? await getBrandBySlug(brandSlug) : null;
  if (brandSlug && !brand) {
    throw new Error(`Brand not found: ${brandSlug}`);
  }
  const brandId = brand?.id;

  const brandOptions = BRANDS.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
  }));
  const featuredNames = ["Canon", "Nikon", "Sony"];
  const featured = brandOptions.filter((b) => featuredNames.includes(b.name));

  const prioritizedBrands = splitBrandsWithPriority(brandOptions);
  const initialReleasePage = await fetchReleaseFeedPage({
    limit: 12,
    brandSlug,
  });
  const trendingSlugs = await fetchTrendingSlugs({
    timeframe: "30d",
    limit: 20,
    filters: brandId ? { brandId } : undefined,
  });

  return (
    <main className="space-y-8">
      {/* browse hero only on root browse page*/}
      {brandSlug ? null : (
        <section className="max-w-3xl space-y-4">
          <h1 className="text-3xl font-bold sm:text-5xl">All Gear</h1>
          <p className="text-muted-foreground">
            Browse our comprehensive gear catalog featuring the latest cameras
            and lenses from all major brands. Results are ordered by release
            date by default with newer items appearing first.
          </p>
        </section>
      )}
      <section className="relative rounded-2xl">
        <div className="relative grid gap-8 lg:grid-cols-[2fr,1fr]">
          {showBrandPicker ? (
            <div className="">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {featured.map((b) => (
                  <Link
                    key={b.id}
                    href={`/browse/${b.slug}`}
                    className="border-border hover:bg-accent/40 group block rounded-lg border p-4 text-center"
                  >
                    <div className="text-lg font-semibold group-hover:underline">
                      {b.name}
                    </div>
                    <div className="text-muted-foreground mt-1 text-sm">
                      Browse {b.name}
                    </div>
                  </Link>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                {brandOptions.length ? (
                  <OtherBrandsSelect
                    brands={[
                      ...prioritizedBrands.hoisted,
                      ...prioritizedBrands.remaining,
                    ]}
                  />
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-2xl font-semibold">
            <span>
              <FlameIcon className="size-5 text-orange-500" />
            </span>
            Trending Gear
          </h2>
          <Button
            variant="link"
            asChild
            icon={<TrendingUpIcon className="text-muted-foreground h-3 w-3" />}
            iconPosition="right"
            className="text-muted-foreground pr-1"
          >
            <Link href="/lists/trending">View Trending List</Link>
          </Button>
        </div>

        <Suspense fallback={<TrendingSkeleton />}>
          <TrendingGrid brandId={brandId} />
        </Suspense>
      </section>

      <ReleaseSection
        brandSlug={brandSlug}
        initialReleasePage={initialReleasePage}
        trendingSlugs={trendingSlugs}
      />
    </main>
  );
}

async function TrendingGrid({ brandId }: { brandId?: string }) {
  const trendingResult = await fetchTrending({
    timeframe: "7d",
    limit: 3,
    filters: brandId ? { brandId } : undefined,
  });

  return (
    <div className="grid w-full grid-cols-1 gap-1 md:grid-cols-2 lg:grid-cols-3">
      {trendingResult.map((g) => (
        <GearCard
          key={g.slug}
          href={`/gear/${g.slug}`}
          slug={g.slug}
          name={g.name}
          regionalAliases={g.regionalAliases}
          brandName={g.brandName}
          thumbnailUrl={g.thumbnailUrl ?? undefined}
          gearType={g.gearType}
          isTrending
          releaseDate={g.releaseDate}
          releaseDatePrecision={g.releaseDatePrecision}
          announcedDate={g.announcedDate}
          announceDatePrecision={g.announceDatePrecision}
          priceText={getItemDisplayPrice(g, {
            style: "short",
            padWholeAmounts: true,
          })}
        />
      ))}
    </div>
  );
}

async function ReleaseSection({
  brandSlug,
  initialReleasePage,
  trendingSlugs,
}: {
  brandSlug?: string;
  initialReleasePage: Awaited<ReturnType<typeof fetchReleaseFeedPage>>;
  trendingSlugs: string[];
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 text-2xl font-semibold">
          <ClockIcon className="text-muted-foreground size-5" />
          Latest releases
        </h2>
      </div>
      <ReleaseFeedGrid
        initialPage={initialReleasePage}
        brandSlug={brandSlug}
        trendingSlugs={trendingSlugs}
      />
    </section>
  );
}

function TrendingSkeleton() {
  return (
    <div className="grid w-full grid-cols-1 gap-1 md:grid-cols-2 lg:grid-cols-3">
      {TRENDING_SKELETON_KEYS.map((key) => (
        <GearCardSkeleton key={key} />
      ))}
    </div>
  );
}
