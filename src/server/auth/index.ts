import NextAuth from "next-auth";
import { cache } from "react";

import { authConfig } from "./config";

const { auth: uncachedAuth, handlers, signIn, signOut } = NextAuth(authConfig);

const auth = cache(uncachedAuth);

export { auth, handlers, signIn, signOut };

export type SessionRole = "USER" | "EDITOR" | "ADMIN";

export function requireRole(
  session: { user?: { role?: SessionRole } } | null | undefined,
  allowed: SessionRole[],
) {
  const role = session?.user?.role;
  return Boolean(role && allowed.includes(role));
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
