import { db } from "~/server/db";
import { gear, brands, cameraSpecs, lensSpecs } from "~/server/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { formatPrice } from "~/lib/mapping";

export default async function GearIndex() {
  const items = await db
    .select({
      id: gear.id,
      slug: gear.slug,
      name: gear.name,
      searchName: gear.searchName,
      gearType: gear.gearType,
      brandName: brands.name,
      brandSlug: brands.slug,
      thumbnailUrl: gear.thumbnailUrl,
      msrpUsdCents: gear.msrpUsdCents,
      releaseDate: gear.releaseDate,
      createdAt: gear.createdAt,
      // Camera specs
      resolutionMp: cameraSpecs.resolutionMp,
      // Lens specs
      focalLengthMinMm: lensSpecs.focalLengthMinMm,
      focalLengthMaxMm: lensSpecs.focalLengthMaxMm,
    })
    .from(gear)
    .leftJoin(brands, eq(gear.brandId, brands.id))
    .leftJoin(cameraSpecs, eq(gear.id, cameraSpecs.gearId))
    .leftJoin(lensSpecs, eq(gear.id, lensSpecs.gearId))
    .orderBy(desc(gear.createdAt))
    .limit(24);

  return (
    <main className="mx-auto min-h-screen max-w-5xl p-6 pt-20">
      <h1 className="mb-6 text-2xl font-semibold">Gear</h1>
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((g) => (
          <li key={g.id} className="border-input bg-card rounded-md border p-4">
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

                  {g.msrpUsdCents && (
                    <div className="text-sm font-medium">
                      {formatPrice(g.msrpUsdCents)}
                    </div>
                  )}
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
    </main>
  );
}
