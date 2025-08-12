import { db } from "~/server/db";
import { cameraSpecs, lensSpecs, sensorFormats } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { formatPrice, getMountDisplayName } from "~/lib/mapping";
import { GearActionButtons } from "~/app/(pages)/gear/_components/gear-action-buttons";
import { GearVisitTracker } from "~/app/(pages)/gear/_components/gear-visit-tracker";
import { GearReviewForm } from "~/app/(pages)/gear/_components/gear-review-form";
import { GearReviewsList } from "~/app/(pages)/gear/_components/gear-reviews-list";
import { fetchGearData } from "~/lib/gear-helpers";

interface GearPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function GearPage({ params }: GearPageProps) {
  const { slug } = await params;

  // Fetch core gear data
  const item = await fetchGearData(slug);

  // Fetch additional specs that aren't in the core helper yet
  const [cameraSpecsData, lensSpecsData] = await Promise.all([
    db
      .select({
        sensorFormatId: cameraSpecs.sensorFormatId,
        resolutionMp: cameraSpecs.resolutionMp,
        isoMin: cameraSpecs.isoMin,
        isoMax: cameraSpecs.isoMax,
        maxFpsRaw: cameraSpecs.maxFpsRaw,
        maxFpsJpg: cameraSpecs.maxFpsJpg,
        extra: cameraSpecs.extra,
      })
      .from(cameraSpecs)
      .where(eq(cameraSpecs.gearId, item.gear.id))
      .limit(1),
    db
      .select({
        focalLengthMinMm: lensSpecs.focalLengthMinMm,
        focalLengthMaxMm: lensSpecs.focalLengthMaxMm,
        hasStabilization: lensSpecs.hasStabilization,
        extra: lensSpecs.extra,
      })
      .from(lensSpecs)
      .where(eq(lensSpecs.gearId, item.gear.id))
      .limit(1),
  ]);

  // Get sensor format if camera specs exist
  let sensorFormat = null;
  if (cameraSpecsData.length > 0 && cameraSpecsData[0]?.sensorFormatId) {
    const sensorFormatData = await db
      .select({
        id: sensorFormats.id,
        name: sensorFormats.name,
        slug: sensorFormats.slug,
      })
      .from(sensorFormats)
      .where(eq(sensorFormats.id, cameraSpecsData[0].sensorFormatId))
      .limit(1);

    if (sensorFormatData.length > 0) {
      sensorFormat = sensorFormatData[0];
    }
  }

  const cameraSpecsItem = cameraSpecsData[0] || null;
  const lensSpecsItem = lensSpecsData[0] || null;

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
            {item.gear.gearType}
          </span>
          {item.brands && (
            <Link
              href={`/brand/${item.brands.slug}`}
              className="text-muted-foreground text-sm"
            >
              {item.brands.name}
            </Link>
          )}
        </div>
        <h1 className="text-3xl font-bold">{item.gear.name}</h1>
        {item.gear.msrpUsdCents && (
          <div className="mt-2 text-2xl font-semibold">
            {formatPrice(item.gear.msrpUsdCents)}
          </div>
        )}
      </div>

      {/* Photo Placeholder */}
      <div className="mb-6">
        {item.gear.thumbnailUrl ? (
          <div className="bg-muted aspect-video overflow-hidden rounded-md">
            <img
              src={item.gear.thumbnailUrl}
              alt={item.gear.name}
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

      {/* Suggest Edit Button */}
      <div className="mb-6">
        <Link
          scroll={false}
          href={`/gear/${item.gear.slug}/edit?type=${item.gear.gearType}`}
          className="bg-primary hover:bg-primary/90 text-primary-foreground inline-flex items-center rounded-md px-4 py-2 text-sm font-medium transition-colors"
        >
          Suggest Edit
        </Link>
      </div>

      {/* Specifications */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Specifications</h2>
          <Link
            scroll={false}
            href={`/gear/${item.gear.slug}/edit?type=${item.gear.gearType}`}
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors"
          >
            Suggest Edit
          </Link>
        </div>
        <div className="border-border overflow-hidden rounded-md border">
          <div className="divide-border divide-y">
            {item.mounts && (
              <div className="flex justify-between px-4 py-3">
                <span className="text-muted-foreground">Mount</span>
                <span className="font-medium">
                  {getMountDisplayName(item.mounts.value)}
                </span>
              </div>
            )}

            {item.gear.releaseDate && (
              <div className="flex justify-between px-4 py-3">
                <span className="text-muted-foreground">Release Date</span>
                <span className="font-medium">
                  {new Date(item.gear.releaseDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}

            {/* Camera-specific specifications */}
            {item.gear.gearType === "CAMERA" && cameraSpecsItem && (
              <>
                {cameraSpecsItem.resolutionMp && (
                  <div className="flex justify-between px-4 py-3">
                    <span className="text-muted-foreground">Resolution</span>
                    <span className="font-medium">
                      {cameraSpecsItem.resolutionMp} MP
                    </span>
                  </div>
                )}

                {sensorFormat && (
                  <div className="flex justify-between px-4 py-3">
                    <span className="text-muted-foreground">Sensor Format</span>
                    <span className="font-medium">{sensorFormat.name}</span>
                  </div>
                )}

                {cameraSpecsItem.isoMin && cameraSpecsItem.isoMax && (
                  <div className="flex justify-between px-4 py-3">
                    <span className="text-muted-foreground">ISO Range</span>
                    <span className="font-medium">
                      {cameraSpecsItem.isoMin} - {cameraSpecsItem.isoMax}
                    </span>
                  </div>
                )}

                {cameraSpecsItem.maxFpsRaw && (
                  <div className="flex justify-between px-4 py-3">
                    <span className="text-muted-foreground">Max FPS (RAW)</span>
                    <span className="font-medium">
                      {cameraSpecsItem.maxFpsRaw} fps
                    </span>
                  </div>
                )}

                {cameraSpecsItem.maxFpsJpg && (
                  <div className="flex justify-between px-4 py-3">
                    <span className="text-muted-foreground">
                      Max FPS (JPEG)
                    </span>
                    <span className="font-medium">
                      {cameraSpecsItem.maxFpsJpg} fps
                    </span>
                  </div>
                )}
              </>
            )}

            {/* Lens-specific specifications */}
            {item.gear.gearType === "LENS" && lensSpecsItem && (
              <>
                {lensSpecsItem.focalLengthMinMm &&
                  lensSpecsItem.focalLengthMaxMm && (
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-muted-foreground">
                        Focal Length
                      </span>
                      <span className="font-medium">
                        {lensSpecsItem.focalLengthMinMm ===
                        lensSpecsItem.focalLengthMaxMm
                          ? `${lensSpecsItem.focalLengthMinMm}mm (Prime)`
                          : `${lensSpecsItem.focalLengthMinMm}mm - ${lensSpecsItem.focalLengthMaxMm}mm (Zoom)`}
                      </span>
                    </div>
                  )}

                {lensSpecsItem.hasStabilization !== null && (
                  <div className="flex justify-between px-4 py-3">
                    <span className="text-muted-foreground">
                      Image Stabilization
                    </span>
                    <span className="font-medium">
                      {lensSpecsItem.hasStabilization ? "Yes" : "No"}
                    </span>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-between px-4 py-3">
              <span className="text-muted-foreground">Added</span>
              <span className="font-medium">
                {new Date(item.gear.createdAt).toLocaleDateString("en-US", {
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
        <h2 className="mb-4 text-lg font-semibold">Reviews</h2>
        <GearReviewForm gearSlug={item.gear.slug} />
        <GearReviewsList gearSlug={item.gear.slug} />
      </div>
    </main>
  );
}
