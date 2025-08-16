import NextAuth from "next-auth";
import { cache } from "react";

import { authConfig } from "./config";

const { auth: uncachedAuth, handlers, signIn, signOut } = NextAuth(authConfig);

const auth = cache(uncachedAuth);

export { auth, handlers, signIn, signOut };

export type SessionRole = "USER" | "EDITOR" | "ADMIN";

export function requireRole(
  session: Awaited<ReturnType<typeof auth>>,
  allowed: SessionRole[],
) {
  const role = (session as any)?.user?.role as SessionRole | undefined;
  return role && allowed.includes(role);
}
