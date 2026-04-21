import "server-only";

import { eq } from "drizzle-orm";

import { db } from "~/server/db";
import { users,type User } from "~/server/db/schema";

export async function findUserByEmailData(email: string): Promise<User | null> {
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return rows[0] ?? null;
}

export async function createDevelopmentUserData(email: string): Promise<User> {
  // Create the fallback user through the existing Drizzle schema so the bypass
  // stays aligned with the normal Better Auth user table.
  const rows = await db
    .insert(users)
    .values({
      email,
      emailVerified: true,
      name: "Development User",
      role: "USER",
    })
    .returning();

  const createdUser = rows[0];

  if (!createdUser) {
    throw new Error("Failed to create the development auth user.");
  }

  return createdUser;
}
