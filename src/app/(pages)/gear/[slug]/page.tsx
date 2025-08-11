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
      <div className="mb-6">
        <Link
          href="/gear"
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
        >
          ← Back to Gear
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Image Section */}
        <div className="space-y-4">
          {item.thumbnailUrl ? (
            <div className="aspect-video overflow-hidden rounded-2xl bg-gray-100">
              <img
                src={item.thumbnailUrl}
                alt={item.name}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-2xl bg-gray-100">
              <div className="text-lg text-gray-400">No image available</div>
            </div>
          )}
        </div>

        {/* Details Section */}
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                {item.gearType}
              </span>
              {item.brand && (
                <Link
                  href={`/brands/${item.brand.slug}`}
                  className="text-sm text-zinc-600 hover:text-zinc-800"
                >
                  {item.brand.name}
                </Link>
              )}
            </div>

            <h1 className="text-3xl font-bold">{item.name}</h1>

            {item.msrpUsdCents && (
              <div className="text-2xl font-semibold text-green-600">
                {formatPrice(item.msrpUsdCents)}
              </div>
            )}
          </div>

          {/* Specifications */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Specifications</h2>
            <div className="grid grid-cols-1 gap-3">
              {item.mount && (
                <div className="flex justify-between border-b border-gray-100 py-2">
                  <span className="text-zinc-600">Mount</span>
                  <span className="font-medium">
                    {getMountDisplayName(item.mount.value)}
                  </span>
                </div>
              )}

              {item.releaseDate && (
                <div className="flex justify-between border-b border-gray-100 py-2">
                  <span className="text-zinc-600">Release Date</span>
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
                    <div className="flex justify-between border-b border-gray-100 py-2">
                      <span className="text-zinc-600">Resolution</span>
                      <span className="font-medium">
                        {item.cameraSpecs.resolutionMp} MP
                      </span>
                    </div>
                  )}

                  {item.sensorFormat && (
                    <div className="flex justify-between border-b border-gray-100 py-2">
                      <span className="text-zinc-600">Sensor Format</span>
                      <span className="font-medium">
                        {item.sensorFormat.name}
                      </span>
                    </div>
                  )}

                  {item.cameraSpecs.isoMin && item.cameraSpecs.isoMax && (
                    <div className="flex justify-between border-b border-gray-100 py-2">
                      <span className="text-zinc-600">ISO Range</span>
                      <span className="font-medium">
                        {item.cameraSpecs.isoMin} - {item.cameraSpecs.isoMax}
                      </span>
                    </div>
                  )}

                  {item.cameraSpecs.maxFpsRaw && (
                    <div className="flex justify-between border-b border-gray-100 py-2">
                      <span className="text-zinc-600">Max FPS (RAW)</span>
                      <span className="font-medium">
                        {item.cameraSpecs.maxFpsRaw} fps
                      </span>
                    </div>
                  )}

                  {item.cameraSpecs.maxFpsJpg && (
                    <div className="flex justify-between border-b border-gray-100 py-2">
                      <span className="text-zinc-600">Max FPS (JPEG)</span>
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
                      <div className="flex justify-between border-b border-gray-100 py-2">
                        <span className="text-zinc-600">Focal Length</span>
                        <span className="font-medium">
                          {item.lensSpecs.focalLengthMinMm ===
                          item.lensSpecs.focalLengthMaxMm
                            ? `${item.lensSpecs.focalLengthMinMm}mm (Prime)`
                            : `${item.lensSpecs.focalLengthMinMm}mm - ${item.lensSpecs.focalLengthMaxMm}mm (Zoom)`}
                        </span>
                      </div>
                    )}

                  {item.lensSpecs.hasStabilization !== null && (
                    <div className="flex justify-between border-b border-gray-100 py-2">
                      <span className="text-zinc-600">Image Stabilization</span>
                      <span className="font-medium">
                        {item.lensSpecs.hasStabilization ? "Yes" : "No"}
                      </span>
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-between border-b border-gray-100 py-2">
                <span className="text-zinc-600">Added</span>
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

          {/* Actions */}
          <div className="pt-4">
            <button className="w-full rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700">
              Add to Collection
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
