import "server-only";

import { syncDiscordAvatarData } from "~/server/users/data";
import { isDiscordAvatarUrl } from "~/lib/auth/avatar";

export type DiscordAvatarProfile = {
  id: string;
  image_url?: string | null;
};

export function getDiscordAvatarUrl(profile: {
  id: string;
  avatar: string | null;
  discriminator: string;
}) {
  if (profile.avatar) {
    const format = profile.avatar.startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${format}`;
  }

  const defaultAvatarNumber =
    profile.discriminator === "0"
      ? Number(BigInt(profile.id) >> BigInt(22)) % 6
      : Number.parseInt(profile.discriminator, 10) % 5;
  return `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNumber}.png`;
}

export function getInitialDiscordAvatarData(image: string | null | undefined) {
  if (!isDiscordAvatarUrl(image)) return null;
  return { discordImage: image, avatarSource: "discord" as const };
}

export async function mapDiscordProfileToUser(profile: DiscordAvatarProfile) {
  const discordImage = profile.image_url ?? null;
  if (discordImage) {
    await syncDiscordAvatarData(profile.id, discordImage);
  }

  return {
    discordImage,
    avatarSource: "discord" as const,
  };
}
