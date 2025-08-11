import { db } from "~/server/db";
import { gear, brands, mounts } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatPrice, getMountDisplayName } from "~/lib/mapping";

interface BrandPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { slug } = await params;

  // Get brand information
  const brandInfo = await db
    .select({
      id: brands.id,
      name: brands.name,
      slug: brands.slug,
    })
    .from(brands)
    .where(eq(brands.slug, slug))
    .limit(1);

  if (!brandInfo.length) {
    notFound();
  }

  const brand = brandInfo[0]!;

  // Get all gear for this brand
  const brandGear = await db
    .select({
      id: gear.id,
      slug: gear.slug,
      name: gear.name,
      gearType: gear.gearType,
      releaseDate: gear.releaseDate,
      msrpUsdCents: gear.msrpUsdCents,
      thumbnailUrl: gear.thumbnailUrl,
      mount: {
        id: mounts.id,
        value: mounts.value,
      },
    })
    .from(gear)
    .leftJoin(mounts, eq(gear.mountId, mounts.id))
    .where(eq(gear.brandId, brand.id))
    .orderBy(gear.createdAt);

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <Link
          href="/gear"
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
        >
          ← Back to Gear
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-4xl font-bold">{brand.name}</h1>
        <p className="mt-2 text-lg text-zinc-600">
          {brandGear.length} piece{brandGear.length !== 1 ? "s" : ""} of gear
        </p>
      </div>

      {brandGear.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-lg text-zinc-500">No gear found for this brand.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {brandGear.map((item) => (
            <Link
              key={item.id}
              href={`/gear/${item.slug}`}
              className="group block rounded-lg border border-gray-200 p-4 transition-all hover:border-gray-300 hover:shadow-md"
            >
              <div className="space-y-3">
                {/* Thumbnail */}
                {item.thumbnailUrl ? (
                  <div className="aspect-video overflow-hidden rounded-lg bg-gray-100">
                    <img
                      src={item.thumbnailUrl}
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-video items-center justify-center rounded-lg bg-gray-100">
                    <div className="text-sm text-gray-400">No image</div>
                  </div>
                )}

                {/* Gear Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                      {item.gearType}
                    </span>
                    {item.mount && (
                      <span className="text-xs text-zinc-500">
                        {getMountDisplayName(item.mount.value)}
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-zinc-900 group-hover:text-blue-600">
                    {item.name}
                  </h3>

                  {item.msrpUsdCents && (
                    <p className="text-sm font-medium text-green-600">
                      {formatPrice(item.msrpUsdCents)}
                    </p>
                  )}

                  {item.releaseDate && (
                    <p className="text-xs text-zinc-500">
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
