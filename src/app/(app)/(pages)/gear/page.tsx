import Link from "next/link";
import { formatPrice } from "~/lib/mapping";
import { BRANDS } from "~/lib/constants";
import { fetchGearForBrand } from "~/server/gear/service";
import { Button } from "~/components/ui/button";
import { GearCard } from "~/components/gear/gear-card";
import type { Metadata } from "next";
import { getMountDisplayName } from "~/lib/mapping";
import { fetchTrendingSlugs } from "~/server/popularity/service";

export const metadata: Metadata = {
  title: "Gear",
};

export const revalidate = 3600; // ISR: re-generate every hour

export default async function GearIndex() {
  // This page is legacy. It will be redirected to /browse
  // Use statically generated brand constants; fetch latest gear per brand
  const brandSections = await Promise.all(
    BRANDS.map(async (b) => {
      const items = await fetchGearForBrand(b.id);
      // Temporarily prioritize items that have a thumbnail, preserving existing sort within each group
      const prioritized = [
        ...items.filter((i) => i.thumbnailUrl != null),
        ...items.filter((i) => i.thumbnailUrl == null),
      ];
      return { brand: b, items: prioritized.slice(0, 12) };
    }),
  );

  const sectionsWithItems = brandSections.filter((s) => s.items.length > 0);
  const trendingSlugs = await fetchTrendingSlugs({
    timeframe: "30d",
    limit: 20,
  });
  const trendingSet = new Set(trendingSlugs);

  return (
    <main className="mx-auto min-h-screen max-w-7xl p-6 pt-20">
      <h1 className="mb-8 text-3xl font-semibold">Gear</h1>
      <div className="space-y-12">
        {sectionsWithItems.map(({ brand, items }) => (
          <section key={brand.id}>
            <h2 className="mb-4 text-2xl font-semibold">{brand.name}</h2>
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
              {items.map((g) => (
                <li key={g.id}>
                  <GearCard
                    href={`/gear/${g.slug}`}
                    slug={g.slug}
                    name={g.name}
                    brandName={g.brandName}
                    thumbnailUrl={g.thumbnailUrl}
                    gearType={g.gearType}
                    isTrending={trendingSet.has(g.slug)}
                    releaseDate={g.releaseDate}
                    releaseDatePrecision={g.releaseDatePrecision}
                  />
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <Button asChild variant="secondary">
                <Link
                  href={`/brand/${brand.slug}`}
                  aria-label={`Show more ${brand.name}`}
                >
                  Show more
                </Link>
              </Button>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
