type ProfilePathUser = {
  handle?: string | null;
  memberNumber?: number | string | null;
};

export function buildUserProfilePath(
  user?: ProfilePathUser | null,
): string | null {
  if (!user) return null;

  const normalizedHandle = user.handle?.trim();
  if (normalizedHandle) {
    return `/u/${normalizedHandle}`;
  }

  if (user.memberNumber === null || user.memberNumber === undefined) {
    return null;
  }

  return `/u/user-${user.memberNumber}`;
}
