import "server-only";

import { and, eq, sql } from "drizzle-orm";
import {
  shouldAdoptDiscordAvatarSource,
  type AvatarSource,
} from "~/lib/auth/avatar";
import { db } from "~/server/db";
import { authAccounts, mounts, users } from "~/server/db/schema";
import type { SocialLink } from "./service";

export async function updateUserSocialLinks(
  userId: string,
  socialLinks: SocialLink[],
) {
  await db.update(users).set({ socialLinks }).where(eq(users.id, userId));
}

export async function updateUserPreferredFilters(
  userId: string,
  preferences: {
    preferredBrandId: string | null;
    preferredMountId: string | null;
  },
) {
  await db.update(users).set(preferences).where(eq(users.id, userId));
}

export function getResolvedUserImageSql() {
  return sql<string | null>`case
    when ${users.avatarSource} = 'discord' then coalesce(${users.discordImage}, ${users.image})
    else ${users.image}
  end`;
}

export async function updateUserAvatarData(
  userId: string,
  data: {
    image?: string | null;
    discordImage?: string | null;
    avatarSource?: AvatarSource | null;
  },
) {
  await db.update(users).set(data).where(eq(users.id, userId));
}

export async function syncDiscordAvatarData(
  providerAccountId: string,
  discordImage: string,
) {
  const rows = await db
    .select({
      userId: users.id,
      image: users.image,
      avatarSource: users.avatarSource,
    })
    .from(authAccounts)
    .innerJoin(users, eq(authAccounts.userId, users.id))
    .where(
      and(
        eq(authAccounts.providerId, "discord"),
        eq(authAccounts.accountId, providerAccountId),
      ),
    )
    .limit(1);

  const user = rows[0];
  if (!user) return;

  await syncDiscordAvatarForUser(user.userId, discordImage, user);
}

export async function syncDiscordAvatarForUser(
  userId: string,
  discordImage: string,
  currentUser?: { image: string | null; avatarSource: AvatarSource | null },
) {
  const user =
    currentUser ??
    (
      await db
        .select({ image: users.image, avatarSource: users.avatarSource })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)
    )[0];

  if (!user) return;

  await updateUserAvatarData(userId, {
    discordImage,
    ...(shouldAdoptDiscordAvatarSource(user)
      ? { avatarSource: "discord" }
      : {}),
  });
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
