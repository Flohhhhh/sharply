// import NextAuth from "next-auth";
// import { cache } from "react";

// import { authConfig } from "./config";
// import { userRoleEnum } from "../db/schema";

// const { auth: uncachedAuth, handlers, signIn, signOut } = NextAuth(authConfig);

// const auth = cache(uncachedAuth);

// export { auth, handlers, signIn, signOut };

// export type UserRole = (typeof userRoleEnum.enumValues)[number];

// // export const USER_ROLE_ORDER: UserRole[] = [
// //   "USER",
// //   "MODERATOR",
// //   "EDITOR",
// //   "ADMIN",
// //   "SUPERADMIN",
// // ];

// // // TODO: allow this to accept our new user type
// // export function requireRole(
// //   session: { user?: { role?: UserRole } } | null | undefined,
// //   allowed: UserRole[],
// // ) {
// //   const role = session?.user?.role;
// //   if (!role || allowed.length === 0) return false;

// //   const rolePriority: Record<UserRole, number> = USER_ROLE_ORDER.reduce(
// //     (acc, value, idx) => ({ ...acc, [value]: idx }),
// //     {} as Record<UserRole, number>,
// //   );

// //   const minimumAllowedPriority = Math.min(
// //     ...allowed.map((allowedRole) => rolePriority[allowedRole]),
// //   );

// //   return rolePriority[role] >= minimumAllowedPriority;
// // }

// // Centralized helpers (legacy NextAuth)
// // export async function getLegacySession(): Promise<{
// //   user: { id: string; role?: UserRole };
// // }> {
// //   const session = await auth();
// //   if (!session?.user?.id)
// //     throw Object.assign(new Error("Unauthorized"), { status: 401 });
// //   return session as { user: { id: string; role?: UserRole } };
// // }

// // Note: Better Auth now prefers `auth.api.getSession({ headers })`.

export { getSessionOrThrow } from "./session-helpers";
