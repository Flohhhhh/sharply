import "server-only";

import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import type { SocialLink } from "./service";

export async function updateUserImage(userId: string, imageUrl: string) {
  await db.update(users).set({ image: imageUrl }).where(eq(users.id, userId));
}

export async function updateUserSocialLinks(
  userId: string,
  socialLinks: SocialLink[],
) {
  await db
    .update(users)
    .set({ socialLinks })
    .where(eq(users.id, userId));
}
