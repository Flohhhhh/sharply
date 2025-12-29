import "server-only";

import { db } from "~/server/db";
import { headers } from "next/headers";
import { auth } from "~/auth";
import type { AuthUser, UserRole } from "~/auth";
import { requireRole } from "~/lib/auth/auth-helpers";
import { getSessionOrThrow } from "~/server/auth";
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
  role: UserRole;
};

function assertIsAdminOrHigher(user: AuthUser | undefined) {
  if (!user || !requireRole(user, ["ADMIN"])) {
    throw new Error("Not authorized");
  }
}

export async function createInvite(
  params: CreateInviteParams,
): Promise<InviteRow> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const user = session?.user;

  assertIsAdminOrHigher(user);
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
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    throw new Error("Unauthorized");
  }
  const user = session?.user;

  assertIsAdminOrHigher(user);
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
  const { user } = await getSessionOrThrow();
  console.info("[invites] claimInvite:start", { inviteId, userId: user.id });
  const invite = await findInviteById(inviteId);
  if (!invite) return { ok: false, reason: "not_found" } as const;
  if (invite.isUsed) return { ok: false, reason: "already_used" } as const;

  try {
    await db.transaction(async (tx) => {
      await assignUserFromInvite(
        {
          userId: user.id,
          inviteId: invite.id,
          name: invite.inviteeName,
          role: invite.role,
        },
        tx,
      );
      await markInviteUsed(invite.id, user.id, tx);
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
