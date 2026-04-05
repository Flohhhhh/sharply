import "server-only";

import { eq } from "drizzle-orm";

import { db } from "~/server/db";
import { users, type User } from "~/server/db/schema";

type DevelopmentUserParams = {
  email: string;
  name?: string;
  role?: User["role"];
  handle?: string | null;
};

export async function findUserByEmailData(email: string): Promise<User | null> {
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return rows[0] ?? null;
}

export async function createDevelopmentUserData({
  email,
  name = "Development User",
  role = "USER",
  handle = null,
}: DevelopmentUserParams): Promise<User> {
  // Create the fallback user through the existing Drizzle schema so the bypass
  // stays aligned with the normal Better Auth user table.
  const rows = await db
    .insert(users)
    .values({
      email,
      emailVerified: true,
      name,
      role,
      handle,
    })
    .returning();

  const createdUser = rows[0];

  if (!createdUser) {
    throw new Error("Failed to create the development auth user.");
  }

  return createdUser;
}

export async function updateDevelopmentUserData(
  userId: string,
  { name = "Development User", role = "USER", handle = null }: Omit<DevelopmentUserParams, "email">,
): Promise<User> {
  const rows = await db
    .update(users)
    .set({
      emailVerified: true,
      name,
      role,
      handle,
    })
    .where(eq(users.id, userId))
    .returning();

  const updatedUser = rows[0];

  if (!updatedUser) {
    throw new Error("Failed to update the development auth user.");
  }

  return updatedUser;
}
