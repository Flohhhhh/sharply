import "server-only";

import { desc, eq } from "drizzle-orm";
import { db } from "~/server/db";
import { invites, users } from "~/server/db/schema";
import type { SessionRole } from "~/server/auth";

export type InviteRow = typeof invites.$inferSelect;

export async function insertInvite(params: {
  inviteeName: string;
  role: SessionRole;
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
): Promise<void> {
  await db
    .update(invites)
    .set({ isUsed: true, usedByUserId: userId, usedAt: new Date() })
    .where(eq(invites.id, inviteId));
}

export async function assignUserFromInvite(params: {
  userId: string;
  inviteId: string;
  name: string;
  role: SessionRole;
}): Promise<void> {
  await db
    .update(users)
    .set({ name: params.name, role: params.role, inviteId: params.inviteId })
    .where(eq(users.id, params.userId));
}
