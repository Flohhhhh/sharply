import NextAuth from "next-auth";
import { cache } from "react";

import { authConfig } from "./config";
import { userRoleEnum } from "../db/schema";

const { auth: uncachedAuth, handlers, signIn, signOut } = NextAuth(authConfig);

const auth = cache(uncachedAuth);

export { auth, handlers, signIn, signOut };

export type SessionRole = (typeof userRoleEnum.enumValues)[number];

export const USER_ROLE_ORDER: SessionRole[] = [
  "USER",
  "MODERATOR",
  "EDITOR",
  "ADMIN",
  "SUPERADMIN",
];

export function requireRole(
  session: { user?: { role?: SessionRole } } | null | undefined,
  allowed: SessionRole[],
) {
  const role = session?.user?.role;
  if (!role || allowed.length === 0) return false;

  const rolePriority: Record<SessionRole, number> = USER_ROLE_ORDER.reduce(
    (acc, value, idx) => ({ ...acc, [value]: idx }),
    {} as Record<SessionRole, number>,
  );

  const minimumAllowedPriority = Math.min(
    ...allowed.map((allowedRole) => rolePriority[allowedRole]),
  );

  return rolePriority[role] >= minimumAllowedPriority;
}

// Centralized helpers
export async function requireUser(): Promise<{
  user: { id: string; role?: SessionRole };
}> {
  const session = await auth();
  if (!session?.user?.id)
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  return session as { user: { id: string; role?: SessionRole } };
}

// Note: requireUserId was removed for a smaller API surface. Use `requireUser()` and access `.user.id`.
