import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GearCard } from "~/components/gear/gear-card";
import { buildLocalizedMetadata } from "~/lib/seo/metadata";
import { fetchBrandBySlug } from "~/server/brands/service";
import { fetchGearForBrand } from "~/server/gear/service";
import { fetchTrendingSlugs } from "~/server/popularity/service";
import BrandTrendingList from "./_components/brand-trending-list";

interface BrandPageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: BrandPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "brandPage" });
  const brand = await fetchBrandBySlug(slug);
  if (!brand) {
    return {
      title: t("brandNotFound"),
      openGraph: { title: t("brandNotFound") },
    };
  }
  return {
    ...buildLocalizedMetadata(`/brand/${slug}`, {
      title: t("brandGearTitle", { brand: brand.name }),
      openGraph: { title: t("brandGearTitle", { brand: brand.name }) },
    }),
  };
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "brandPage" });

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
          {t("backToGear")}
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-4xl font-bold">{brand.name}</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          {t("gearCount", { count: brandGear.length })}
        </p>
      </div>

      <div className="mb-8">
        <BrandTrendingList brandId={brand.id} timeframe="30d" limit={10} />
      </div>

      {brandGear.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground text-lg">
            {t("noGearFound")}
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
              regionalAliases={item.regionalAliases}
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
