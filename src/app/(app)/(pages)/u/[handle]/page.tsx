import { notFound } from "next/navigation";
import Link from "next/link";
import { formatPrice, getMountDisplayName } from "~/lib/mapping";
import { UserReviewsList } from "~/app/(app)/(pages)/u/_components/user-reviews-list";
import { UserBadges } from "~/app/(app)/(pages)/u/_components/user-badges";
import {
  fetchUserById,
  fetchUserOwnedItems,
  fetchUserWishlistItems,
  fetchFullUserById,
} from "~/server/users/service";
// Note: page is a Server Component and reads from the service layer only.
import type { Metadata } from "next";
import { auth } from "~/server/auth";
import { Button } from "~/components/ui/button";
import { UserPen } from "lucide-react";
import { ShowUserCardButton } from "~/app/(app)/(pages)/u/_components/ShowUserCardButton";

interface UserProfilePageProps {
  params: Promise<{
    handle: string;
  }>;
}

export async function generateMetadata({
  params,
}: UserProfilePageProps): Promise<Metadata> {
  const { handle } = await params;
  const user = await fetchUserById(handle);
  return {
    title: `${user?.name}'s Profile`,
    openGraph: {
      title: `${user?.name}'s Profile`,
    },
  };
}

export default async function UserProfilePage({
  params,
}: UserProfilePageProps) {
  const { handle } = await params;
  const session = await auth();

  // Load user profile
  const user = await fetchFullUserById(handle);
  if (!user) notFound();

  // Wishlist and owned items via service layer
  const [wishlistItems, ownedItems] = await Promise.all([
    fetchUserWishlistItems(user.id),
    fetchUserOwnedItems(user.id),
  ]);

  // ownedItems loaded above

  const myProfile = user.id === session?.user?.id;

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-6 pt-32">
      {/* User Header */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
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
            <p className="text-muted-foreground">Gear Collection & Wishlist</p>
          </div>
        </div>
        {myProfile && (
          <div className="flex items-center gap-2">
            <Button asChild icon={<UserPen />} className="self-end">
              <Link href="/profile/settings">Edit Profile</Link>
            </Button>
            <ShowUserCardButton user={user} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Badges */}
        <div className="space-y-4 lg:col-span-2">
          <UserBadges userId={user.id} />
        </div>

        {/* Collection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Collection</h2>
            <span className="bg-secondary rounded-full px-3 py-1 text-sm font-medium">
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
            <div className="border-border rounded-lg border-2 border-dashed p-8 text-center">
              <p className="text-muted-foreground">No gear in collection yet</p>
              <Link href="/gear" className="text-primary mt-2 inline-block">
                Browse gear to add to your collection
              </Link>
            </div>
          )}
        </div>

        {/* Wishlist */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Wishlist</h2>
            <span className="bg-secondary rounded-full px-3 py-1 text-sm font-medium">
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
            <div className="border-border rounded-lg border-2 border-dashed p-8 text-center">
              <p className="text-muted-foreground">No items in wishlist yet</p>
              <Link href="/gear" className="text-primary mt-2 inline-block">
                Browse gear to add to your wishlist
              </Link>
            </div>
          )}
        </div>

        {/* Reviews */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Reviews</h2>
          </div>
          <UserReviewsList userId={user.id} />
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
      className="border-input bg-card hover:bg-accent block rounded-md border p-4"
    >
      <div className="flex gap-4">
        {item.thumbnailUrl ? (
          <div className="bg-muted h-20 w-20 flex-shrink-0 overflow-hidden rounded-md">
            <img
              src={item.thumbnailUrl}
              alt={item.name}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="bg-muted h-20 w-20 flex-shrink-0 rounded-md" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-medium">{item.name}</h3>
              <div className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
                <span className="bg-secondary rounded-full px-2 py-1 text-xs font-medium">
                  {item.gearType}
                </span>
                {item.brand && (
                  <span className="truncate">{item.brand.name}</span>
                )}
              </div>
              {item.mount && (
                <p className="text-muted-foreground mt-1 text-xs">
                  {getMountDisplayName(item.mount.value)}
                </p>
              )}
            </div>

            {item.msrpNowUsdCents && (
              <div className="text-right">
                <p className="font-medium">
                  {formatPrice(item.msrpNowUsdCents)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
