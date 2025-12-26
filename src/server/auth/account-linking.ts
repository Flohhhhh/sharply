import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { db } from "~/server/db";
import { accounts } from "~/server/db/schema";

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

export async function fetchLinkedAccountsForUser(
  userId: string,
): Promise<LinkedAccountMap> {
  const rows = await db
    .select({
      provider: accounts.provider,
      providerAccountId: accounts.providerAccountId,
    })
    .from(accounts)
    .where(
      and(
        eq(accounts.userId, userId),
        inArray(accounts.provider, [...SUPPORTED_PROVIDERS]),
      ),
    );

  const result = emptyLinkedMap();
  for (const row of rows) {
    const provider = row.provider as SupportedProvider;
    // Only keep the first match per provider; UI enforces single link.
    if (!result[provider]) {
      result[provider] = {
        provider,
        providerAccountId: row.providerAccountId,
      };
    }
  }
  return result;
}

export async function unlinkProviderAccount(
  userId: string,
  provider: SupportedProvider,
) {
  await db
    .delete(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.provider, provider)));
}

