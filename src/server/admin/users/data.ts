import "server-only";

import { desc } from "drizzle-orm";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import type { UserRole } from "~/auth";

export type AdminUserListItem = {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  memberNumber: number;
  createdAt: Date;
};

export async function fetchAllUsersData(): Promise<AdminUserListItem[]> {
  const userRows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      memberNumber: users.memberNumber,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  return userRows;
}
