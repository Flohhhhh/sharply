import { db } from "~/server/db";
import {
  gear,
  brands,
  mounts,
  wishlists,
  ownerships,
  users,
} from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatPrice, getMountDisplayName } from "~/lib/mapping";

interface UserProfilePageProps {
  params: Promise<{
    handle: string;
  }>;
}

export default async function UserProfilePage({
  params,
}: UserProfilePageProps) {
  const { handle } = await params;

  // Get user by handle (assuming handle is the user ID for now)
  const userResult = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
    })
    .from(users)
    .where(eq(users.id, handle))
    .limit(1);

  if (!userResult.length) {
    notFound();
  }

  const user = userResult[0]!;

  // Get user's wishlist items
  const wishlistItems = await db
    .select({
      id: gear.id,
      slug: gear.slug,
      name: gear.name,
      gearType: gear.gearType,
      msrpUsdCents: gear.msrpUsdCents,
      thumbnailUrl: gear.thumbnailUrl,
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
    .from(wishlists)
    .innerJoin(gear, eq(wishlists.gearId, gear.id))
    .leftJoin(brands, eq(gear.brandId, brands.id))
    .leftJoin(mounts, eq(gear.mountId, mounts.id))
    .where(eq(wishlists.userId, user.id));

  // Get user's owned items
  const ownedItems = await db
    .select({
      id: gear.id,
      slug: gear.slug,
      name: gear.name,
      gearType: gear.gearType,
      msrpUsdCents: gear.msrpUsdCents,
      thumbnailUrl: gear.thumbnailUrl,
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
    .from(ownerships)
    .innerJoin(gear, eq(ownerships.gearId, gear.id))
    .leftJoin(brands, eq(gear.brandId, brands.id))
    .leftJoin(mounts, eq(gear.mountId, mounts.id))
    .where(eq(ownerships.userId, user.id));

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-8">
        <Link
          href="/gear"
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
        >
          ← Back to Gear
        </Link>
      </div>

      {/* User Header */}
      <div className="mb-8 flex items-center gap-4">
        {user.image && (
          <img
            src={user.image}
            alt={user.name || "User"}
            className="h-16 w-16 rounded-full"
          />
        )}
        <div>
          <h1 className="text-3xl font-bold">
            {user.name || "Anonymous User"}
          </h1>
          <p className="text-zinc-600">Gear Collection & Wishlist</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Collection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Collection</h2>
            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
              {ownedItems.length} items
            </span>
          </div>

          {ownedItems.length > 0 ? (
            <div className="space-y-3">
              {ownedItems.map((item) => (
                <GearCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
              <p className="text-gray-500">No gear in collection yet</p>
              <Link
                href="/gear"
                className="mt-2 inline-block text-blue-600 hover:text-blue-800"
              >
                Browse gear to add to your collection
              </Link>
            </div>
          )}
        </div>

        {/* Wishlist */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Wishlist</h2>
            <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
              {wishlistItems.length} items
            </span>
          </div>

          {wishlistItems.length > 0 ? (
            <div className="space-y-3">
              {wishlistItems.map((item) => (
                <GearCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
              <p className="text-gray-500">No items in wishlist yet</p>
              <Link
                href="/gear"
                className="mt-2 inline-block text-blue-600 hover:text-blue-800"
              >
                Browse gear to add to your wishlist
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

// Gear card component for displaying individual items
function GearCard({ item }: { item: any }) {
  return (
    <Link
      href={`/gear/${item.slug}`}
      className="block rounded-lg border border-gray-200 p-4 transition-colors hover:border-gray-300 hover:bg-gray-50"
    >
      <div className="flex gap-4">
        {item.thumbnailUrl ? (
          <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
            <img
              src={item.thumbnailUrl}
              alt={item.name}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="h-20 w-20 flex-shrink-0 rounded-lg bg-gray-100" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-medium text-gray-900">
                {item.name}
              </h3>
              <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                  {item.gearType}
                </span>
                {item.brand && (
                  <span className="truncate">{item.brand.name}</span>
                )}
              </div>
              {item.mount && (
                <p className="mt-1 text-xs text-gray-500">
                  {getMountDisplayName(item.mount.value)}
                </p>
              )}
            </div>

            {item.msrpUsdCents && (
              <div className="text-right">
                <p className="font-medium text-green-600">
                  {formatPrice(item.msrpUsdCents)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
