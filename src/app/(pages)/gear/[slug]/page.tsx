import { db } from "~/server/db";
import { gear, brands, mounts } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatPrice, getMountDisplayName } from "~/lib/mapping";

interface GearPageProps {
  params: {
    slug: string;
  };
}

export default async function GearPage({ params }: GearPageProps) {
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
    })
    .from(gear)
    .leftJoin(brands, eq(gear.brandId, brands.id))
    .leftJoin(mounts, eq(gear.mountId, mounts.id))
    .where(eq(gear.slug, params.slug))
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
