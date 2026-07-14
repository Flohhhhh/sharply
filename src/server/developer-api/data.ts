import "server-only";

import { and, desc, eq, gte, inArray, isNull, sql } from "drizzle-orm";
import { db } from "~/server/db";
import {
  developerApiKeys,
  developerApiRateLimitBuckets,
  developerApiUsageDaily,
  users,
} from "~/server/db/schema";
import type { DeveloperApiEndpoint } from "./constants";

export type DeveloperApiKeyRow = typeof developerApiKeys.$inferSelect;

export async function findUsableApiKeyByHash(keyHash: string) {
  const rows = await db
    .select({
      key: developerApiKeys,
      developerAccessEnabled: users.developerAccessEnabled,
    })
    .from(developerApiKeys)
    .innerJoin(users, eq(developerApiKeys.userId, users.id))
    .where(
      and(
        eq(developerApiKeys.keyHash, keyHash),
        isNull(developerApiKeys.revokedAt),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function countActiveApiKeysForUser(userId: string) {
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(developerApiKeys)
    .where(
      and(
        eq(developerApiKeys.userId, userId),
        isNull(developerApiKeys.revokedAt),
      ),
    );
  return Number(rows[0]?.count ?? 0);
}

export async function createApiKeyData(params: {
  userId: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
}) {
  const rows = await db.insert(developerApiKeys).values(params).returning();
  return rows[0]!;
}

export async function listApiKeysForUser(userId: string) {
  return db
    .select()
    .from(developerApiKeys)
    .where(eq(developerApiKeys.userId, userId))
    .orderBy(desc(developerApiKeys.createdAt));
}

export async function listAllApiKeysData() {
  return db
    .select()
    .from(developerApiKeys)
    .orderBy(desc(developerApiKeys.createdAt));
}

export async function revokeApiKeyData(params: {
  keyId: string;
  revokedByUserId: string;
  userId?: string;
}) {
  const conditions = [
    eq(developerApiKeys.id, params.keyId),
    isNull(developerApiKeys.revokedAt),
  ];
  if (params.userId)
    conditions.push(eq(developerApiKeys.userId, params.userId));

  const rows = await db
    .update(developerApiKeys)
    .set({ revokedAt: new Date(), revokedByUserId: params.revokedByUserId })
    .where(and(...conditions))
    .returning({ id: developerApiKeys.id });
  return rows[0] ?? null;
}

export async function revokeAllApiKeysForUser(
  userId: string,
  revokedByUserId: string,
) {
  await db
    .update(developerApiKeys)
    .set({ revokedAt: new Date(), revokedByUserId })
    .where(
      and(
        eq(developerApiKeys.userId, userId),
        isNull(developerApiKeys.revokedAt),
      ),
    );
}

export async function setDeveloperAccessData(userId: string, enabled: boolean) {
  const rows = await db
    .update(users)
    .set({ developerAccessEnabled: enabled, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      developerAccessEnabled: users.developerAccessEnabled,
    });
  return rows[0] ?? null;
}

export async function getDeveloperAccessData(userId: string) {
  const rows = await db
    .select({ enabled: users.developerAccessEnabled })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return rows[0]?.enabled ?? false;
}

export async function consumeRateLimitBucket(params: {
  apiKeyId: string;
  windowStart: Date;
}) {
  const rows = await db
    .insert(developerApiRateLimitBuckets)
    .values({ ...params, requestCount: 1 })
    .onConflictDoUpdate({
      target: [
        developerApiRateLimitBuckets.apiKeyId,
        developerApiRateLimitBuckets.windowStart,
      ],
      set: {
        requestCount: sql`${developerApiRateLimitBuckets.requestCount} + 1`,
      },
    })
    .returning({ requestCount: developerApiRateLimitBuckets.requestCount });
  return rows[0]?.requestCount ?? 1;
}

export async function touchApiKeyLastUsed(apiKeyId: string) {
  await db
    .update(developerApiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(developerApiKeys.id, apiKeyId));
}

export async function incrementUsageData(params: {
  apiKeyId: string;
  usageDate: Date;
  endpoint: DeveloperApiEndpoint;
}) {
  await db
    .insert(developerApiUsageDaily)
    .values({
      apiKeyId: params.apiKeyId,
      usageDate: params.usageDate,
      totalRequests: 1,
      searchRequests: params.endpoint === "search" ? 1 : 0,
      suggestionRequests: params.endpoint === "suggestions" ? 1 : 0,
      gearRequests: params.endpoint === "gear" ? 1 : 0,
    })
    .onConflictDoUpdate({
      target: [
        developerApiUsageDaily.apiKeyId,
        developerApiUsageDaily.usageDate,
      ],
      set: {
        totalRequests: sql`${developerApiUsageDaily.totalRequests} + 1`,
        searchRequests:
          params.endpoint === "search"
            ? sql`${developerApiUsageDaily.searchRequests} + 1`
            : developerApiUsageDaily.searchRequests,
        suggestionRequests:
          params.endpoint === "suggestions"
            ? sql`${developerApiUsageDaily.suggestionRequests} + 1`
            : developerApiUsageDaily.suggestionRequests,
        gearRequests:
          params.endpoint === "gear"
            ? sql`${developerApiUsageDaily.gearRequests} + 1`
            : developerApiUsageDaily.gearRequests,
      },
    });
}

export async function getUsageForKeyIdsSince(apiKeyIds: string[], since: Date) {
  if (apiKeyIds.length === 0) return [];
  return db
    .select()
    .from(developerApiUsageDaily)
    .where(
      and(
        inArray(developerApiUsageDaily.apiKeyId, apiKeyIds),
        gte(developerApiUsageDaily.usageDate, since),
      ),
    );
}

export async function listDeveloperUsersData() {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      developerAccessEnabled: users.developerAccessEnabled,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));
}
