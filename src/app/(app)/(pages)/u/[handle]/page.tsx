import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  getItemDisplayPrice,
  getMountDisplayName,
  PRICE_FALLBACK_TEXT,
} from "~/lib/mapping";
import { UserReviewsList } from "~/app/(app)/(pages)/u/_components/user-reviews-list";
import { UserBadges } from "~/app/(app)/(pages)/u/_components/user-badges";
import { SocialLinksDisplay } from "~/app/(app)/(pages)/u/_components/social-links-display";
import type { SocialLink } from "~/server/users/service";
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
import type { GearItem } from "~/types/gear";
import { getBrandNameById } from "~/lib/mapping/brand-map";
import { CollectionContainer } from "~/app/(app)/(pages)/u/_components/collection/collection-container";

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

  const sortedOwnedItems = sortOwnedItems(ownedItems);

  // ownedItems loaded above

  const myProfile = user.id === session?.user?.id;

  // Parse social links from JSONB
  const socialLinks: SocialLink[] = Array.isArray(user.socialLinks)
    ? (user.socialLinks as SocialLink[])
    : [];

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

      {/* Social Links */}
      {socialLinks.length > 0 && (
        <div className="mb-8">
          <SocialLinksDisplay links={socialLinks} />
        </div>
      )}

      <div className="flex flex-col gap-8">
        {/* Badges */}
        <div className="space-y-4 lg:col-span-2">
          <UserBadges userId={user.id} />
        </div>

        {/* Collection */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Collection</h2>
          <CollectionContainer items={sortedOwnedItems} user={user} />
        </div>
        {/* <div className="space-y-4">
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
        </div> */}

        {/* Wishlist */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Wishlist</h2>
            <span className="bg-secondary rounded-full px-3 py-1 text-sm font-medium">
              {wishlistItems.length} items
            </span>
          </div>

          {wishlistItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
function GearCard({ item }: { item: GearItem }) {
  const brandName = getBrandNameById(item.brandId);
  const displayName = getDisplayName(item, brandName);
  const priceDisplay = getItemDisplayPrice(item, {
    style: "short",
    padWholeAmounts: true,
  });

  return (
    <Link
      href={`/gear/${item.slug}`}
      className="group border-border/80 hover:border-foreground/50 block overflow-hidden rounded-xl border transition-colors"
    >
      <div className="flex gap-3 p-3">
        {item.thumbnailUrl ? (
          <div className="bg-muted relative aspect-[4/3] w-28 flex-shrink-0 overflow-hidden rounded-lg">
            <Image
              src={item.thumbnailUrl}
              alt={displayName}
              fill
              sizes="(min-width: 1024px) 180px, 30vw"
              className="object-contain p-2"
            />
          </div>
        ) : (
          <div className="bg-muted text-muted-foreground relative aspect-[4/3] w-28 flex-shrink-0 overflow-hidden rounded-lg">
            <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs font-medium">
              {displayName}
            </div>
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 leading-tight font-semibold">
              {displayName}
            </h3>
            <span
              className={
                priceDisplay === PRICE_FALLBACK_TEXT
                  ? "text-muted-foreground text-sm"
                  : "text-sm font-semibold"
              }
            >
              {priceDisplay}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function getDisplayName(item: GearItem, brandName?: string | null) {
  const trimmed = stripBrandFromName(item.name, brandName);
  return trimmed || item.name;
}

function stripBrandFromName(name: string, brandName?: string | null) {
  const normalizedName = name?.trim();
  if (!normalizedName) return normalizedName;

  if (!brandName) return normalizedName;

  const normalizedBrand = brandName.trim();
  if (!normalizedBrand) return normalizedName;

  const pattern = new RegExp(
    `^${escapeRegExp(normalizedBrand)}(?:\\s+|[-–—:]\\s*)`,
    "i",
  );

  const stripped = normalizedName.replace(pattern, "").trim();
  return stripped || normalizedName;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sortOwnedItems(items: GearItem[]) {
  return [...items].sort((firstItem, secondItem) => {
    const firstPriority = getGearTypePriority(firstItem);
    const secondPriority = getGearTypePriority(secondItem);

    const priorityDifference = firstPriority - secondPriority;
    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    if (firstPriority === 0 && secondPriority === 0) {
      const firstCameraRelease = getReleaseTimestamp(firstItem);
      const secondCameraRelease = getReleaseTimestamp(secondItem);
      if (firstCameraRelease !== null || secondCameraRelease !== null) {
        if (firstCameraRelease === null) {
          return 1;
        }
        if (secondCameraRelease === null) {
          return -1;
        }

        const releaseDifference = secondCameraRelease - firstCameraRelease;
        if (releaseDifference !== 0) {
          return releaseDifference;
        }
      }
    }

    if (firstPriority === 1 && secondPriority === 1) {
      const focalLengthDifference =
        getLensMinimumFocalLength(firstItem) -
        getLensMinimumFocalLength(secondItem);
      if (focalLengthDifference !== 0) {
        return focalLengthDifference;
      }
    }

    return firstItem.name.localeCompare(secondItem.name);
  });
}

function getGearTypePriority(item: GearItem) {
  const gearTypeIdentifier = item.gearType?.toUpperCase() ?? "";
  if (gearTypeIdentifier === "CAMERA") {
    return 0;
  }

  if (gearTypeIdentifier === "LENS") {
    return 1;
  }

  return 2;
}

function getLensMinimumFocalLength(item: GearItem) {
  const normalize = (value: number | null | undefined) =>
    typeof value === "number" && Number.isFinite(value) ? value : null;

  const primaryCandidate =
    normalize(item.lensSpecs?.focalLengthMinMm) ??
    normalize(item.fixedLensSpecs?.focalLengthMinMm);
  if (primaryCandidate != null) {
    return primaryCandidate;
  }

  const candidates: number[] = [];
  const pushCandidate = (value: number | null | undefined) => {
    if (typeof value === "number" && Number.isFinite(value)) {
      candidates.push(value);
    }
  };

  pushCandidate(item.lensSpecs?.focalLengthMaxMm);
  pushCandidate(item.fixedLensSpecs?.focalLengthMaxMm);

  const parsed = parseFocalFromName(item.name);
  if (parsed != null) {
    candidates.push(parsed);
  }

  if (candidates.length === 0) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.min(...candidates);
}

function parseFocalFromName(name?: string) {
  if (!name) return null;
  const rangeMatch = name.match(/(\d+(?:\.\d+)?)\s*-\s*\d+(?:\.\d+)?\s*mm/i);
  if (rangeMatch) {
    return Number(rangeMatch[1]);
  }

  const singleMatch = name.match(/(\d+(?:\.\d+)?)\s*mm/i);
  if (!singleMatch) return null;
  return Number(singleMatch[1]);
}

function getReleaseTimestamp(item: GearItem) {
  const releaseValue = item.releaseDate;
  if (!releaseValue) {
    return null;
  }

  const parsedDate =
    releaseValue instanceof Date ? releaseValue : new Date(releaseValue);
  const timeValue = parsedDate.getTime();
  if (Number.isNaN(timeValue)) {
    return null;
  }
  return timeValue;
}
