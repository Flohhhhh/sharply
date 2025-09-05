import { fetchBrandBySlug } from "~/server/brands/service";
import { fetchGearForBrand } from "~/server/gear/service";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatPrice, getMountDisplayName } from "~/lib/mapping";
import BrandTrendingList from "./_components/brand-trending-list";

interface BrandPageProps {
  params: Promise<{
    slug: string;
  }>;
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

  return (
    <main className="mx-auto max-w-6xl p-6">
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
            <Link
              key={item.id}
              href={`/gear/${item.slug}`}
              className="border-input bg-card hover:bg-accent block rounded-md border p-4"
            >
              <div className="space-y-3">
                {/* Thumbnail */}
                {item.thumbnailUrl ? (
                  <div className="bg-muted aspect-video overflow-hidden rounded-md">
                    <img
                      src={item.thumbnailUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="bg-muted flex aspect-video items-center justify-center rounded-md">
                    <div className="text-muted-foreground text-sm">
                      No image
                    </div>
                  </div>
                )}

                {/* Gear Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-secondary rounded-full px-2 py-1 text-xs font-medium">
                      {item.gearType}
                    </span>
                    {(() => {
                      const m = (item as any).mount as
                        | { id: string; value: string }
                        | null
                        | undefined;
                      return m ? (
                        <span className="text-muted-foreground text-xs">
                          {getMountDisplayName(m.value)}
                        </span>
                      ) : null;
                    })()}
                  </div>

                  <h3 className="font-semibold">{item.name}</h3>

                  {item.msrpUsdCents && (
                    <p className="text-sm font-medium">
                      {formatPrice(item.msrpUsdCents)}
                    </p>
                  )}

                  {item.releaseDate && (
                    <p className="text-muted-foreground text-xs">
                      Released{" "}
                      {new Date(item.releaseDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                      })}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
