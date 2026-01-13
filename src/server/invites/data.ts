import "server-only";

import { desc, eq } from "drizzle-orm";
import { db } from "~/server/db";
import { invites, users } from "~/server/db/schema";
import type { UserRole } from "~/auth";

type DbClient = Pick<typeof db, "update" | "query">;

export type InviteRow = typeof invites.$inferSelect;

export async function insertInvite(params: {
  inviteeName: string;
  role: UserRole;
  createdById: string;
}): Promise<InviteRow> {
  const [row] = await db
    .insert(invites)
    .values({
      inviteeName: params.inviteeName,
      role: params.role,
      createdById: params.createdById,
    })
    .returning();
  if (!row) throw new Error("Failed to create invite");
  return row;
}

export async function selectInvites(): Promise<InviteRow[]> {
  return db.select().from(invites).orderBy(desc(invites.createdAt));
}

export async function findInviteById(id: string): Promise<InviteRow | null> {
  const rows = await db
    .select()
    .from(invites)
    .where(eq(invites.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function markInviteUsed(
  inviteId: string,
  userId: string,
  client: DbClient = db,
): Promise<void> {
  await client
    .update(invites)
    .set({ isUsed: true, usedByUserId: userId, usedAt: new Date() })
    .where(eq(invites.id, inviteId));
}

export async function assignUserFromInvite(
  params: {
    userId: string;
    inviteId: string;
    name: string;
    role: UserRole;
  },
  client: DbClient = db,
): Promise<void> {
  const ROLE_PRIORITY: Record<UserRole, number> = {
    USER: 0,
    MODERATOR: 1,
    EDITOR: 2,
    ADMIN: 3,
    SUPERADMIN: 4,
  };

  const currentUser = await client.query.users.findFirst({
    columns: { role: true },
    where: eq(users.id, params.userId),
  });

  const currentRole = currentUser?.role ?? "USER";
  const targetRolePriority =
    ROLE_PRIORITY[params.role] ?? 0;
  const currentRolePriority =
    ROLE_PRIORITY[currentRole] ?? 0;
  const nextRole =
    currentRolePriority >= targetRolePriority ? currentRole : params.role;

  await client
    .update(users)
    .set({
      name: params.name,
      role: nextRole,
      inviteId: params.inviteId,
    })
    .where(eq(users.id, params.userId));
}
