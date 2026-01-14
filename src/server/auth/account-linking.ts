import "server-only";

import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";

import { auth } from "~/auth";

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
  _userId: string,
): Promise<LinkedAccountMap> {
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
