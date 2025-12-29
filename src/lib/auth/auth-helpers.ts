import type { AuthUser, UserRole } from "~/auth";

export const USER_ROLE_ORDER: UserRole[] = [
  "USER",
  "MODERATOR",
  "EDITOR",
  "ADMIN",
  "SUPERADMIN",
];

export function requireRole(
  user: AuthUser | null | undefined,
  allowed: UserRole[],
) {
  if (!user) {
    return false;
  }

  const role = user.role;
  if (!role || allowed.length === 0) return false;

  const rolePriority: Record<UserRole, number> = USER_ROLE_ORDER.reduce(
    (acc, value, idx) => ({ ...acc, [value]: idx }),
    {} as Record<UserRole, number>,
  );

  const minimumAllowedPriority = Math.min(
    ...allowed.map((allowedRole) => rolePriority[allowedRole] ?? 0),
  );

  return rolePriority[role] ?? 0 >= minimumAllowedPriority;
}
