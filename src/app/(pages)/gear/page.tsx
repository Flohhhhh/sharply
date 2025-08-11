import { db } from "~/server/db";
import { gear, brands } from "~/server/db/schema";
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
    })
    .from(gear)
    .leftJoin(brands, eq(gear.brandId, brands.id))
    .orderBy(desc(gear.createdAt))
    .limit(24);

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">Gear</h1>
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((g) => (
          <li
            key={g.id}
            className="rounded-2xl border p-6 transition-shadow hover:shadow-lg"
          >
            <Link href={`/gear/${g.slug}`} className="block">
              <div className="space-y-3">
                {g.thumbnailUrl && (
                  <div className="aspect-video overflow-hidden rounded-lg bg-gray-100">
                    <img
                      src={g.thumbnailUrl}
                      alt={g.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-zinc-500">{g.brandName}</div>
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
                      {g.gearType}
                    </span>
                  </div>
                  <div className="text-lg font-medium">{g.name}</div>
                  {g.msrpUsdCents && (
                    <div className="text-sm font-medium text-green-600">
                      {formatPrice(g.msrpUsdCents)}
                    </div>
                  )}
                  {g.releaseDate && (
                    <div className="text-xs text-zinc-400">
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
