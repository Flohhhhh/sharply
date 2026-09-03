export const avatarSourceValues = ["discord", "custom"] as const;

export type AvatarSource = (typeof avatarSourceValues)[number];

export type AvatarFields = {
  image?: string | null;
  discordImage?: string | null;
  avatarSource?: AvatarSource | null;
};

const DISCORD_AVATAR_HOSTS = new Set([
  "cdn.discordapp.com",
  "media.discordapp.net",
]);

export function isDiscordAvatarUrl(value: string | null | undefined) {
  if (!value) return false;

  try {
    return DISCORD_AVATAR_HOSTS.has(new URL(value).hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function getEffectiveAvatarSource(user: AvatarFields): AvatarSource {
  if (user.avatarSource) return user.avatarSource;
  return isDiscordAvatarUrl(user.image) ? "discord" : "custom";
}

export function resolveUserAvatar(user: AvatarFields): string | null {
  if (getEffectiveAvatarSource(user) === "discord") {
    return (
      user.discordImage ??
      (isDiscordAvatarUrl(user.image) ? (user.image ?? null) : null)
    );
  }

  return user.image ?? null;
}

export function shouldAdoptDiscordAvatarSource(user: AvatarFields) {
  return user.avatarSource == null && isDiscordAvatarUrl(user.image);
}
