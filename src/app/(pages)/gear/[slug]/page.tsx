import { db } from "~/server/db";
import {
  gear,
  brands,
  mounts,
  cameraSpecs,
  lensSpecs,
  sensorFormats,
} from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatPrice, getMountDisplayName } from "~/lib/mapping";
import { GearActionButtons } from "~/components/gear-action-buttons";
import { GearVisitTracker } from "~/components/gear-visit-tracker";
import { GearReviewForm } from "~/components/gear-review-form";
import { GearReviewsList } from "~/components/gear-reviews-list";

interface GearPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function GearPage({ params }: GearPageProps) {
  const { slug } = await params;
  const gearItem = await db
    .select({
      id: gear.id,
      slug: gear.slug,
      name: gear.name,
      searchName: gear.searchName,
      gearType: gear.gearType,
      brandId: gear.brandId,
      mountId: gear.mountId,
      releaseDate: gear.releaseDate,
      msrpUsdCents: gear.msrpUsdCents,
      thumbnailUrl: gear.thumbnailUrl,
      createdAt: gear.createdAt,
      updatedAt: gear.updatedAt,
      brand: {
        id: brands.id,
        name: brands.name,
        slug: brands.slug,
      },
      mount: {
        id: mounts.id,
        value: mounts.value,
      },
      cameraSpecs: {
        sensorFormatId: cameraSpecs.sensorFormatId,
        resolutionMp: cameraSpecs.resolutionMp,
        isoMin: cameraSpecs.isoMin,
        isoMax: cameraSpecs.isoMax,
        maxFpsRaw: cameraSpecs.maxFpsRaw,
        maxFpsJpg: cameraSpecs.maxFpsJpg,
        extra: cameraSpecs.extra,
      },
      lensSpecs: {
        focalLengthMinMm: lensSpecs.focalLengthMinMm,
        focalLengthMaxMm: lensSpecs.focalLengthMaxMm,
        hasStabilization: lensSpecs.hasStabilization,
        extra: lensSpecs.extra,
      },
      sensorFormat: {
        id: sensorFormats.id,
        name: sensorFormats.name,
        slug: sensorFormats.slug,
      },
    })
    .from(gear)
    .leftJoin(brands, eq(gear.brandId, brands.id))
    .leftJoin(mounts, eq(gear.mountId, mounts.id))
    .leftJoin(cameraSpecs, eq(gear.id, cameraSpecs.gearId))
    .leftJoin(lensSpecs, eq(gear.id, lensSpecs.gearId))
    .leftJoin(sensorFormats, eq(cameraSpecs.sensorFormatId, sensorFormats.id))
    .where(eq(gear.slug, slug))
    .limit(1);

  if (!gearItem.length) {
    notFound();
  }

  const item = gearItem[0]!;

  return (
    <main className="mx-auto max-w-4xl p-6">
      {/* Track page visit for popularity */}
      <GearVisitTracker slug={slug} />

      <div className="mb-6">
        <Link
          href="/gear"
          className="text-primary flex items-center gap-2 text-sm"
        >
          ← Back to Gear
        </Link>
      </div>

      {/* Item Name and Brand */}
      <div className="mb-6">
        <div className="mb-3 flex items-center gap-3">
          <span className="bg-secondary rounded-full px-3 py-1 text-xs font-medium">
            {item.gearType}
          </span>
          {item.brand && (
            <Link
              href={`/brand/${item.brand.slug}`}
              className="text-muted-foreground text-sm"
            >
              {item.brand.name}
            </Link>
          )}
        </div>
        <h1 className="text-3xl font-bold">{item.name}</h1>
        {item.msrpUsdCents && (
          <div className="mt-2 text-2xl font-semibold">
            {formatPrice(item.msrpUsdCents)}
          </div>
        )}
      </div>

      {/* Photo Placeholder */}
      <div className="mb-6">
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
            <div className="text-muted-foreground text-lg">
              No image available
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mb-8">
        <GearActionButtons slug={slug} />
      </div>

      {/* Specifications */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Specifications</h2>
        <div className="border-border overflow-hidden rounded-md border">
          <div className="divide-border divide-y">
            {item.mount && (
              <div className="flex justify-between px-4 py-3">
                <span className="text-muted-foreground">Mount</span>
                <span className="font-medium">
                  {getMountDisplayName(item.mount.value)}
                </span>
              </div>
            )}

            {item.releaseDate && (
              <div className="flex justify-between px-4 py-3">
                <span className="text-muted-foreground">Release Date</span>
                <span className="font-medium">
                  {new Date(item.releaseDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}

            {/* Camera-specific specifications */}
            {item.gearType === "CAMERA" && item.cameraSpecs && (
              <>
                {item.cameraSpecs.resolutionMp && (
                  <div className="flex justify-between px-4 py-3">
                    <span className="text-muted-foreground">Resolution</span>
                    <span className="font-medium">
                      {item.cameraSpecs.resolutionMp} MP
                    </span>
                  </div>
                )}

                {item.sensorFormat && (
                  <div className="flex justify-between px-4 py-3">
                    <span className="text-muted-foreground">Sensor Format</span>
                    <span className="font-medium">
                      {item.sensorFormat.name}
                    </span>
                  </div>
                )}

                {item.cameraSpecs.isoMin && item.cameraSpecs.isoMax && (
                  <div className="flex justify-between px-4 py-3">
                    <span className="text-muted-foreground">ISO Range</span>
                    <span className="font-medium">
                      {item.cameraSpecs.isoMin} - {item.cameraSpecs.isoMax}
                    </span>
                  </div>
                )}

                {item.cameraSpecs.maxFpsRaw && (
                  <div className="flex justify-between px-4 py-3">
                    <span className="text-muted-foreground">Max FPS (RAW)</span>
                    <span className="font-medium">
                      {item.cameraSpecs.maxFpsRaw} fps
                    </span>
                  </div>
                )}

                {item.cameraSpecs.maxFpsJpg && (
                  <div className="flex justify-between px-4 py-3">
                    <span className="text-muted-foreground">
                      Max FPS (JPEG)
                    </span>
                    <span className="font-medium">
                      {item.cameraSpecs.maxFpsJpg} fps
                    </span>
                  </div>
                )}
              </>
            )}

            {/* Lens-specific specifications */}
            {item.gearType === "LENS" && item.lensSpecs && (
              <>
                {item.lensSpecs.focalLengthMinMm &&
                  item.lensSpecs.focalLengthMaxMm && (
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-muted-foreground">
                        Focal Length
                      </span>
                      <span className="font-medium">
                        {item.lensSpecs.focalLengthMinMm ===
                        item.lensSpecs.focalLengthMaxMm
                          ? `${item.lensSpecs.focalLengthMinMm}mm (Prime)`
                          : `${item.lensSpecs.focalLengthMinMm}mm - ${item.lensSpecs.focalLengthMaxMm}mm (Zoom)`}
                      </span>
                    </div>
                  )}

                {item.lensSpecs.hasStabilization !== null && (
                  <div className="flex justify-between px-4 py-3">
                    <span className="text-muted-foreground">
                      Image Stabilization
                    </span>
                    <span className="font-medium">
                      {item.lensSpecs.hasStabilization ? "Yes" : "No"}
                    </span>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-between px-4 py-3">
              <span className="text-muted-foreground">Added</span>
              <span className="font-medium">
                {new Date(item.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-12">
        <h2 className="text-lg font-semibold mb-4">Reviews</h2>
        <GearReviewForm gearSlug={item.slug} />
        <GearReviewsList gearSlug={item.slug} />
      </div>
    </main>
  );
}
