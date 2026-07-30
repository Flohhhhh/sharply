import "server-only";

import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { mounts, users } from "~/server/db/schema";
import type { SocialLink } from "./service";

export async function updateUserSocialLinks(
  userId: string,
  socialLinks: SocialLink[],
) {
  await db
    .update(users)
    .set({ socialLinks })
    .where(eq(users.id, userId));
}

export async function updateUserPreferredFilters(
  userId: string,
  preferences: {
    preferredBrandId: string | null;
    preferredMountId: string | null;
  },
) {
  await db
    .update(users)
    .set(preferences)
    .where(eq(users.id, userId));
}

export async function fetchMountPreferenceOption(mountId: string) {
  const rows = await db
    .select({
      id: mounts.id,
      brandId: mounts.brandId,
    })
    .from(mounts)
    .where(eq(mounts.id, mountId))
    .limit(1);

  return rows[0] ?? null;
}
