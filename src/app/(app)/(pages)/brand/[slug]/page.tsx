import { fetchBrandBySlug } from "~/server/brands/service";
import { fetchGearForBrand } from "~/server/gear/service";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { GearCard } from "~/components/gear/gear-card";
import BrandTrendingList from "./_components/brand-trending-list";
import { fetchTrendingSlugs } from "~/server/popularity/service";

interface BrandPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: BrandPageProps): Promise<Metadata> {
  const { slug } = await params;
  const brand = await fetchBrandBySlug(slug);
  if (!brand) {
    return {
      title: "Brand Not Found",
      openGraph: { title: "Brand Not Found" },
    };
  }
  return {
    title: `${brand.name} Gear`,
    openGraph: { title: `${brand.name} Gear` },
  };
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { slug } = await params;

  // Get brand information
  const brand = await fetchBrandBySlug(slug);
  if (!brand) {
    notFound();
  }

  // Get all gear for this brand
  const brandGear = await fetchGearForBrand(brand.id);
  const trendingSlugs = await fetchTrendingSlugs({
    timeframe: "30d",
    limit: 20,
    filters: { brandId: brand.id },
  });
  const trendingSet = new Set(trendingSlugs);

  return (
    <main className="mx-auto mt-24 max-w-6xl p-6">
      <div className="mb-6">
        <Link
          href="/gear"
          className="text-primary flex items-center gap-2 text-sm"
        >
          ← Back to Gear
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-4xl font-bold">{brand.name}</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          {brandGear.length} piece{brandGear.length !== 1 ? "s" : ""} of gear
        </p>
      </div>

      <div className="mb-8">
        <BrandTrendingList brandId={brand.id} timeframe="30d" limit={10} />
      </div>

      {brandGear.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground text-lg">
            No gear found for this brand.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {brandGear.map((item) => (
            <GearCard
              key={item.id}
              href={`/gear/${item.slug}`}
              slug={item.slug}
              name={item.name}
              brandName={item.brandName}
              thumbnailUrl={item.thumbnailUrl}
              gearType={item.gearType}
              isTrending={trendingSet.has(item.slug)}
              releaseDate={item.releaseDate}
              releaseDatePrecision={item.releaseDatePrecision}
            />
          ))}
        </div>
      )}
    </main>
  );
}
