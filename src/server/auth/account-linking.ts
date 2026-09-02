import "server-only";

import { headers } from "next/headers";

import { auth } from "~/auth";
import { getDiscordAvatarUrl } from "~/server/auth/discord-profile";
import {
  syncDiscordAvatarForUser,
  updateUserAvatarData,
} from "~/server/users/data";

export const SUPPORTED_PROVIDERS = ["discord", "google"] as const;

export type SupportedProvider = (typeof SUPPORTED_PROVIDERS)[number];

export type LinkedAccountInfo = {
  provider: SupportedProvider;
  providerAccountId: string;
};

type LinkedAccountMap = Record<SupportedProvider, LinkedAccountInfo | null>;

const emptyLinkedMap = (): LinkedAccountMap => ({
  discord: null,
  google: null,
});

// fetch linked accounts for a user
export async function fetchLinkedAccountsForUser(
  userId?: string,
): Promise<LinkedAccountMap> {
  void userId;
  const result = emptyLinkedMap();

  const apiResult: unknown = await auth.api.listUserAccounts({
    headers: await headers(),
  });

  if (
    apiResult &&
    !Array.isArray(apiResult) &&
    (apiResult as { error?: unknown }).error
  ) {
    return result;
  }

  const rows = Array.isArray(apiResult)
    ? apiResult
    : Array.isArray((apiResult as { data?: unknown }).data)
      ? ((apiResult as { data: unknown[] }).data as Array<{
          providerId: string;
          accountId: string;
        }>)
      : [];

  for (const row of rows) {
    const provider = row.providerId as SupportedProvider;
    if (provider !== "discord" && provider !== "google") continue;
    // Only keep the first match per provider; UI enforces a single account per provider.
    if (!result[provider]) {
      result[provider] = {
        provider,
        providerAccountId: row.accountId,
      };
    }
  }
  return result;
}

export async function disconnectLinkedAccount(
  provider: SupportedProvider,
  accountId: string,
) {
  if (!SUPPORTED_PROVIDERS.includes(provider)) {
    throw new Error("Unsupported account provider");
  }
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session?.user) throw new Error("Unauthorized");

  await auth.api.unlinkAccount({
    headers: requestHeaders,
    body: { providerId: provider, accountId },
  });

  if (provider === "discord") {
    await updateUserAvatarData(session.user.id, { avatarSource: "custom" });
  }

  return { ok: true as const };
}

export async function syncCurrentDiscordAvatar() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session?.user) throw new Error("Unauthorized");

  const tokenResult = await auth.api.getAccessToken({
    headers: requestHeaders,
    body: { providerId: "discord" },
  });
  const accessToken = tokenResult?.accessToken;
  if (!accessToken) throw new Error("Discord access token is unavailable");

  const response = await fetch("https://discord.com/api/users/@me", {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Unable to refresh the Discord profile");

  const profile = (await response.json()) as {
    id?: string;
    avatar?: string | null;
    discriminator?: string;
  };
  if (!profile.id) throw new Error("Discord returned an invalid profile");

  const discordImage = getDiscordAvatarUrl({
    id: profile.id,
    avatar: profile.avatar ?? null,
    discriminator: profile.discriminator ?? "0",
  });
  await syncDiscordAvatarForUser(session.user.id, discordImage);

  return { ok: true as const, discordImage };
}
