import Link from "next/link";
import { formatPrice } from "~/lib/mapping";
import { BRANDS } from "~/lib/constants";
import { fetchGearForBrand } from "~/server/gear/service";
import { Button } from "~/components/ui/button";

export const revalidate = 3600; // ISR: re-generate every hour

export default async function GearIndex() {
  // Use statically generated brand constants; fetch latest gear per brand
  const brandSections = await Promise.all(
    BRANDS.map(async (b) => {
      const items = await fetchGearForBrand(b.id);
      return { brand: b, items: items.slice(0, 12) };
    }),
  );

  const sectionsWithItems = brandSections.filter((s) => s.items.length > 0);

  return (
    <main className="mx-auto min-h-screen max-w-7xl p-6 pt-20">
      <h1 className="mb-8 text-3xl font-semibold">Gear</h1>
      <div className="space-y-12">
        {sectionsWithItems.map(({ brand, items }) => (
          <section key={brand.id}>
            <h2 className="mb-4 text-2xl font-semibold">{brand.name}</h2>
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((g) => (
                <li
                  key={g.id}
                  className="border-input bg-card rounded-md border p-4"
                >
                  <Link href={`/gear/${g.slug}`} className="block">
                    <div className="space-y-3">
                      {g.thumbnailUrl && (
                        <div className="bg-muted aspect-video overflow-hidden rounded-md">
                          <img
                            src={g.thumbnailUrl}
                            alt={g.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-muted-foreground text-sm">
                            <p>{g.brandName}</p>
                          </div>
                          <span className="bg-secondary rounded-full px-2 py-1 text-xs">
                            {g.gearType}
                          </span>
                        </div>
                        <div className="text-lg font-medium">{g.name}</div>

                        {/* Basic specifications */}
                        {g.gearType === "CAMERA" && g.resolutionMp && (
                          <div className="text-muted-foreground text-sm">
                            {g.resolutionMp} MP
                          </div>
                        )}

                        {g.gearType === "LENS" && g.focalLengthMinMm && (
                          <div className="text-muted-foreground text-sm">
                            {g.focalLengthMinMm === g.focalLengthMaxMm
                              ? `${g.focalLengthMinMm}mm (Prime)`
                              : `${g.focalLengthMinMm}mm - ${g.focalLengthMaxMm}mm`}
                          </div>
                        )}

                        {(g as any).msrpNowUsdCents ||
                        (g as any).msrpUsdCents ? (
                          <div className="text-sm font-medium">
                            {formatPrice(
                              ((g as any).msrpNowUsdCents ??
                                (g as any).msrpUsdCents) as number,
                            )}
                          </div>
                        ) : null}
                        {g.releaseDate && (
                          <div className="text-muted-foreground text-xs">
                            Released {new Date(g.releaseDate).getFullYear()}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
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
