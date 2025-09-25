import "server-only";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "~/server/db";
import { auth, requireUser } from "~/server/auth";
import { users } from "~/server/db/schema";
import {
  assignUserFromInvite,
  findInviteById,
  insertInvite,
  markInviteUsed,
  selectInvites,
  type InviteRow,
} from "./data";

export type CreateInviteParams = {
  inviteeName: string;
  role: "USER" | "EDITOR" | "ADMIN";
};

function assertIsAdmin(role: string | undefined) {
  if (!role || !["ADMIN"].includes(role)) {
    throw new Error("Not authorized");
  }
}

export async function createInvite(
  params: CreateInviteParams,
): Promise<InviteRow> {
  const session = await auth();
  assertIsAdmin(session?.user?.role as string | undefined);
  if (!session?.user?.id) throw new Error("Missing user");
  console.info("[invites] createInvite:start", {
    actorUserId: session.user.id,
    role: params.role,
    inviteeName: params.inviteeName,
  });
  return insertInvite({
    inviteeName: params.inviteeName.trim(),
    role: params.role,
    createdById: session.user.id,
  });
}

export async function listInvites(): Promise<InviteRow[]> {
  const session = await auth();
  assertIsAdmin(session?.user?.role as string | undefined);
  console.info("[invites] listInvites", { actorUserId: session?.user?.id });
  const rows = await selectInvites();
  console.info("[invites] listInvites:result", { count: rows.length });
  return rows;
}

/** Public-safe read: used by invite landing page */
export async function fetchInviteById(
  inviteId: string,
): Promise<InviteRow | null> {
  return findInviteById(inviteId);
}

export async function claimInvite(
  inviteId: string,
): Promise<
  | { ok: true; alreadyUsed?: boolean }
  | { ok: false; reason: "not_found" | "already_used" }
> {
  const { user } = await requireUser();
  console.info("[invites] claimInvite:start", { inviteId, userId: user.id });
  const invite = await findInviteById(inviteId);
  if (!invite) return { ok: false, reason: "not_found" } as const;
  if (invite.isUsed) return { ok: false, reason: "already_used" } as const;

  try {
    await db.transaction(async () => {
      await assignUserFromInvite({
        userId: user.id,
        inviteId: invite.id,
        name: invite.inviteeName,
        role: invite.role,
      });
      await markInviteUsed(invite.id, user.id);
    });
  } catch (err) {
    console.error("[invites] claimInvite:error", {
      inviteId,
      userId: user.id,
      err,
    });
    throw err;
  }

  console.info("[invites] claimInvite:success", { inviteId, userId: user.id });
  return { ok: true } as const;
}
