import { ClockIcon, FlameIcon } from "lucide-react";
import Link from "next/link";
import { GearCard } from "~/components/gear/gear-card";
import { Button } from "~/components/ui/button";
import { BRANDS } from "~/lib/constants";
import { OtherBrandsSelect } from "./other-brands-select";
import { getLatestGear } from "~/server/gear/browse/data";
import { fetchTrendingWithLive } from "~/server/popularity/service";
import { getItemDisplayPrice } from "~/lib/mapping";

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
  const recentlyReleasedGear = await getLatestGear(
    3,
    brandSlug ? { brandSlug } : undefined,
  );
  const brand = brandSlug
    ? BRANDS.find((b) => b.slug === brandSlug)
    : undefined;
  const trendingResult = await fetchTrendingWithLive({
    timeframe: "7d",
    limit: 3,
    filters: brand ? { brandId: brand.id } : undefined,
  });
  const liveFormatter = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  });
  return (
    <main className="space-y-6">
      {/* Featured brands buttons */}
      {showBrandPicker ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Browse by Brand</h2>
            {otherBrands.length ? (
              <OtherBrandsSelect brands={otherBrands as any} />
            ) : null}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* TODO: should add a secondary way to access any brand (maybe a dropdown or something) */}
            {featured.map((b) => (
              <Link
                key={b.id}
                href={`/browse/${b.slug}`}
                className="border-border hover:bg-accent/40 group block rounded-lg border p-6 text-center"
              >
                <div className="text-2xl font-semibold group-hover:underline">
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

      {/* most recently released gear items (all brands) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-2xl font-semibold">
            <ClockIcon className="text-muted-foreground size-5" />
            Latest Gear
          </h2>
          <Button variant="link" asChild>
            {/* TODO: link to some relevant page or remove this button */}
            <Link href="#">View All</Link>
          </Button>
        </div>
        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recentlyReleasedGear.map((g) => (
            <GearCard
              key={g.id}
              href={`/gear/${g.slug}`}
              slug={g.slug}
              name={g.name}
              brandName={g.brandName as any}
              thumbnailUrl={g.thumbnailUrl}
              gearType={g.gearType}
              dateText={
                g.releaseDate
                  ? `Released ${new Date(g.releaseDate as any).getFullYear()}`
                  : null
              }
              priceText={getItemDisplayPrice(g, {
                style: "short",
                padWholeAmounts: true,
              })}
            />
          ))}
        </div>
      </div>
      {/* trending gear items (all brands) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-2xl font-semibold">
            <span>
              <FlameIcon className="size-5 text-orange-500" />
            </span>
            Trending Gear
          </h2>
          <Button variant="link" asChild>
            {/* TODO: link to a trending list */}
            <Link href="#">View All</Link>
          </Button>
        </div>
        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trendingResult.items.map((g) => (
            <GearCard
              key={g.slug}
              href={`/gear/${g.slug}`}
              slug={g.slug}
              name={g.name}
              brandName={g.brandName}
              gearType={g.gearType}
              topLeftLabel={g.liveOnly ? "Live spike" : null}
              metaRight={
                g.liveScore && g.liveScore > 0
                  ? `+${liveFormatter.format(g.liveScore)} live`
                  : undefined
              }
              priceText={getItemDisplayPrice(g, {
                style: "short",
                padWholeAmounts: true,
              })}
            />
          ))}
        </div>
      </div>
      {/* TODO: add a lists section to show curated lists (maybe on a right sidebar or something) */}
    </main>
  );
}
