import "server-only";

import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";

export async function updateUserImage(userId: string, imageUrl: string) {
  await db.update(users).set({ image: imageUrl }).where(eq(users.id, userId));
}
