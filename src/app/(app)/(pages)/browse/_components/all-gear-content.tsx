import { ClockIcon, FlameIcon } from "lucide-react";
import Link from "next/link";
import { GearCard } from "~/components/gear/gear-card";
import { Button } from "~/components/ui/button";
import { BRANDS } from "~/lib/constants";
import { OtherBrandsSelect } from "./other-brands-select";
import { fetchTrending } from "~/server/popularity/service";
import { getItemDisplayPrice } from "~/lib/mapping";
import { fetchReleaseFeedPage } from "~/server/gear/browse/service";
import { ReleaseFeedGrid } from "./release-feed-grid";

export default async function AllGearContent({
  brandSlug,
  showBrandPicker = true,
}: { brandSlug?: string; showBrandPicker?: boolean } = {}) {
  const featured = BRANDS.filter((b) =>
    ["Canon", "Nikon", "Sony"].includes(b.name),
  );
  const otherBrands = BRANDS.filter(
    (b) => !["Canon", "Nikon", "Sony"].includes(b.name),
  );
  const otherBrandOptions = otherBrands.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
  }));
  const brand = brandSlug
    ? BRANDS.find((b) => b.slug === brandSlug)
    : undefined;
  const initialReleasePage = await fetchReleaseFeedPage({
    limit: 12,
    brandSlug,
  });
  const trendingResult = await fetchTrending({
    timeframe: "7d",
    limit: 3,
    filters: brand ? { brandId: brand.id } : undefined,
  });
  return (
    <main className="space-y-10">
      <section className="border-border bg-muted/50 relative overflow-hidden rounded-2xl border px-6 py-10 sm:px-10">
        <div className="from-background/50 absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l via-transparent to-transparent sm:block" />
        <div className="relative grid gap-8 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              {brand ? `${brand.name} releases` : "All gear releases"}
            </p>
            <h1 className="text-3xl font-semibold sm:text-4xl">
              Discover the latest gear
            </h1>
            <p className="text-muted-foreground max-w-2xl text-base">
              Browse every camera and lens in release order. The first dozen
              items are preloaded and you can dive deeper with infinite scroll.
            </p>
          </div>
          {showBrandPicker ? (
            <div className="bg-background/60 space-y-3 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-muted-foreground text-sm font-semibold">
                  Popular brands
                </div>
                {otherBrandOptions.length ? (
                  <OtherBrandsSelect brands={otherBrandOptions} />
                ) : null}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
          <Button variant="link" asChild>
            <Link href="/lists/trending">View All</Link>
          </Button>
        </div>
        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trendingResult.map((g) => (
            <GearCard
              key={g.slug}
              href={`/gear/${g.slug}`}
              slug={g.slug}
              name={g.name}
              brandName={g.brandName}
              thumbnailUrl={g.thumbnailUrl ?? undefined}
              gearType={g.gearType}
              topLeftLabel={null}
              priceText={getItemDisplayPrice(g, {
                style: "short",
                padWholeAmounts: true,
              })}
            />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center gap-2 text-2xl font-semibold">
            <ClockIcon className="text-muted-foreground size-5" />
            Latest releases
          </h2>
          {/* <p className="text-muted-foreground text-sm">
            Release date descending; start with 12 then continue with infinite
            scroll.
          </p> */}
        </div>
        <ReleaseFeedGrid
          initialPage={initialReleasePage}
          brandSlug={brandSlug}
        />
      </section>
    </main>
  );
}
