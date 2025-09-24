import "server-only";

import { auth } from "~/server/auth";
import { eq, sql } from "drizzle-orm";
import { db } from "~/server/db";
import {
  brands,
  gear,
  reviews,
  users,
  wishlists,
  ownerships,
  mounts,
} from "~/server/db/schema";

export async function getUserReviews(userId: string) {
  return db
    .select({
      id: reviews.id,
      content: reviews.content,
      status: reviews.status,
      createdAt: reviews.createdAt,
      updatedAt: reviews.updatedAt,
      gearId: gear.id,
      gearSlug: gear.slug,
      gearName: gear.name,
      gearType: gear.gearType,
      brandName: brands.name,
    })
    .from(reviews)
    .leftJoin(gear, eq(reviews.gearId, gear.id))
    .leftJoin(brands, eq(gear.brandId, brands.id))
    .where(eq(reviews.createdById, userId))
    .orderBy(reviews.createdAt);
}

export async function fetchCurrentUserReviews() {
  const session = await auth();
  if (!session?.user?.id)
    return [] as Awaited<ReturnType<typeof getUserReviews>>;
  return getUserReviews(session.user.id);
}

export async function fetchUserById(userId: string) {
  const row = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      memberNumber: users.memberNumber,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row[0] ?? null;
}

export async function fetchFullUserById(userId: string) {
  const row = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row[0] ?? null;
}

type GearListItem = {
  id: string;
  slug: string;
  name: string;
  gearType: string;
  msrpNowUsdCents: number | null;
  thumbnailUrl: string | null;
  brand: { id: string; name: string; slug: string } | null;
  mount: { id: string; value: string } | null;
};

export async function fetchUserWishlistItems(
  userId: string,
): Promise<GearListItem[]> {
  const rows = await db
    .select({
      id: gear.id,
      slug: gear.slug,
      name: gear.name,
      gearType: gear.gearType,
      msrpNowUsdCents: gear.msrpNowUsdCents,
      thumbnailUrl: gear.thumbnailUrl,
      brand: { id: brands.id, name: brands.name, slug: brands.slug },
      mount: { id: mounts.id, value: mounts.value },
    })
    .from(wishlists)
    .innerJoin(gear, eq(wishlists.gearId, gear.id))
    .leftJoin(brands, eq(gear.brandId, brands.id))
    .leftJoin(mounts, eq(gear.mountId, mounts.id))
    .where(eq(wishlists.userId, userId));
  return rows as unknown as GearListItem[];
}

export async function fetchUserOwnedItems(
  userId: string,
): Promise<GearListItem[]> {
  const rows = await db
    .select({
      id: gear.id,
      slug: gear.slug,
      name: gear.name,
      gearType: gear.gearType,
      msrpNowUsdCents: gear.msrpNowUsdCents,
      thumbnailUrl: gear.thumbnailUrl,
      brand: { id: brands.id, name: brands.name, slug: brands.slug },
      mount: { id: mounts.id, value: mounts.value },
    })
    .from(ownerships)
    .innerJoin(gear, eq(ownerships.gearId, gear.id))
    .leftJoin(brands, eq(gear.brandId, brands.id))
    .leftJoin(mounts, eq(gear.mountId, mounts.id))
    .where(eq(ownerships.userId, userId));
  return rows as unknown as GearListItem[];
}

export async function fetchUsersWithAnniversaryToday(): Promise<
  { id: string }[]
> {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(
      sql`to_char(${users.emailVerified}, 'MM-DD') = to_char(now(), 'MM-DD')`,
    );
  return rows;
}
