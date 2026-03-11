import "server-only";

import { Redis } from "@upstash/redis";
import { env } from "~/env";

export const CHANGE_REQUEST_WEBHOOK_WINDOW_MINUTES = 60;
export const CHANGE_REQUEST_WEBHOOK_CRON_INTERVAL_MINUTES = 5;
export const CHANGE_REQUEST_WEBHOOK_PENDING_ITEM_LIMIT = 5;

const CHANGE_REQUEST_WEBHOOK_WINDOW_SECONDS =
  CHANGE_REQUEST_WEBHOOK_WINDOW_MINUTES * 60;
const CHANGE_REQUEST_WEBHOOK_FLUSH_LOCK_SECONDS = 120;

export const CHANGE_REQUEST_WEBHOOK_KEYS = {
  windowActive: "change_requests:webhook_window_active",
  pendingCount: "change_requests:webhook_pending_count",
  windowStartedAt: "change_requests:webhook_window_started_at",
  flushLock: "change_requests:webhook_flush_lock",
  pendingItems: "change_requests:webhook_pending_items",
} as const;

export type ChangeRequestWebhookItemSummary = {
  proposalId: string;
  gearId: string;
  gearType: string | null;
  gearName: string;
  gearSlug: string;
};

type DiscordWebhookPayload = {
  username: string;
  content: string;
};

type RedisSetOptions = {
  nx?: boolean;
  ex?: number;
};

type RedisLike = {
  set: (
    key: string,
    value: string,
    options?: RedisSetOptions,
  ) => Promise<unknown>;
  get: <T = unknown>(key: string) => Promise<T | null>;
  exists: (key: string) => Promise<number>;
  incr: (key: string) => Promise<number>;
  del: (...keys: string[]) => Promise<number>;
  lpush: (key: string, ...elements: string[]) => Promise<number>;
  ltrim: (key: string, start: number, stop: number) => Promise<unknown>;
  lrange: <T = string>(key: string, start: number, stop: number) => Promise<T[]>;
};

type SendWebhookFn = (payload: DiscordWebhookPayload) => Promise<void>;

type SharedDeps = {
  redis?: RedisLike;
  now?: Date;
  sendWebhook?: SendWebhookFn;
  webhookUrl?: string;
  moderationUrl?: string;
};

export type NotifyChangeRequestModeratorsResult =
  | { status: "skipped_no_webhook" }
  | { status: "sent_immediate" }
  | { status: "queued_for_aggregate"; pendingCount: number }
  | { status: "immediate_failed_queued"; pendingCount: number };

export type FlushChangeRequestWebhookResult =
  | { status: "skipped_no_webhook" }
  | { status: "lock_not_acquired" }
  | { status: "window_active" }
  | { status: "no_pending" }
  | { status: "sent_aggregate"; pendingCount: number };

const globalForChangeRequestWebhookRedis = globalThis as typeof globalThis & {
  __changeRequestWebhookRedis?: RedisLike;
};

function hasStandardUpstashRestEnv() {
  const hasUrl = Boolean(
    process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  );
  const hasToken = Boolean(
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
  );
  return Boolean(
    hasUrl && hasToken,
  );
}

function hasLegacyUpstashKvEnv() {
  return Boolean(
    process.env.UPSTASH_KV_REST_API_URL && process.env.UPSTASH_KV_REST_API_TOKEN,
  );
}

function getChangeRequestWebhookRedisClient(deps?: SharedDeps): RedisLike {
  if (deps?.redis) return deps.redis;
  if (globalForChangeRequestWebhookRedis.__changeRequestWebhookRedis) {
    return globalForChangeRequestWebhookRedis.__changeRequestWebhookRedis;
  }

  let redis: RedisLike;
  if (hasStandardUpstashRestEnv()) {
    redis = Redis.fromEnv() as unknown as RedisLike;
  } else if (hasLegacyUpstashKvEnv()) {
    redis = new Redis({
      url: process.env.UPSTASH_KV_REST_API_URL!,
      token: process.env.UPSTASH_KV_REST_API_TOKEN!,
    }) as unknown as RedisLike;
  } else {
    throw new Error(
      "Missing Upstash Redis REST env vars for change-request webhook aggregation.",
    );
  }

  if (env.NODE_ENV !== "production") {
    globalForChangeRequestWebhookRedis.__changeRequestWebhookRedis = redis;
  }
  return redis;
}

function resolveWebhookUrl(deps?: SharedDeps) {
  return deps?.webhookUrl ?? env.DISCORD_CHANGE_REQUEST_WEBHOOK_URL ?? "";
}

function resolveModerationUrl(deps?: SharedDeps) {
  if (deps?.moderationUrl) return deps.moderationUrl;
  return new URL("/admin", env.NEXT_PUBLIC_BASE_URL).toString();
}

function resolveWebhookSender(
  webhookUrl: string,
  deps?: SharedDeps,
): SendWebhookFn {
  if (deps?.sendWebhook) return deps.sendWebhook;
  return (payload) => sendDiscordWebhook(webhookUrl, payload);
}

function toPositiveInt(value: unknown): number {
  const normalized = typeof value === "string" ? value.trim() : value;
  const parsed = Number(normalized ?? 0);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.trunc(parsed);
}

function parsePendingItems(rawItems: string[]): ChangeRequestWebhookItemSummary[] {
  const parsed: ChangeRequestWebhookItemSummary[] = [];
  for (const raw of rawItems) {
    try {
      const item = JSON.parse(raw) as Partial<ChangeRequestWebhookItemSummary>;
      if (
        item &&
        typeof item.proposalId === "string" &&
        typeof item.gearId === "string" &&
        typeof item.gearName === "string" &&
        typeof item.gearSlug === "string"
      ) {
        parsed.push({
          proposalId: item.proposalId,
          gearId: item.gearId,
          gearType:
            typeof item.gearType === "string" ? item.gearType : item.gearType ?? null,
          gearName: item.gearName,
          gearSlug: item.gearSlug,
        });
      }
    } catch {
      // Ignore malformed redis entries; continue processing valid items.
    }
  }
  return parsed;
}

function formatItemSummaryLine(item: ChangeRequestWebhookItemSummary) {
  const typeLabel = item.gearType ? ` (${item.gearType})` : "";
  return `${item.gearName}${typeLabel} • /gear/${item.gearSlug}`;
}

function buildImmediateWebhookContent(params: {
  item: ChangeRequestWebhookItemSummary;
  moderationUrl: string;
}) {
  const { item, moderationUrl } = params;
  const typeLabel = item.gearType ? ` (${item.gearType})` : "";
  return [
    "**New change request submitted**",
    `- Gear: ${item.gearName}${typeLabel}`,
    `- Proposal ID: \`${item.proposalId}\``,
    `- Review queue: ${moderationUrl}`,
  ].join("\n");
}

function buildAggregatedWebhookContent(params: {
  pendingCount: number;
  pendingItems: ChangeRequestWebhookItemSummary[];
  moderationUrl: string;
  windowStartedAt: string | null;
}) {
  const headerLines = [
    "**Change request summary**",
    `- Pending requests in last window: ${params.pendingCount}`,
    params.windowStartedAt
      ? `- Window started: ${params.windowStartedAt}`
      : undefined,
    `- Review queue: ${params.moderationUrl}`,
  ].filter(Boolean) as string[];

  if (params.pendingItems.length === 0) {
    return headerLines.join("\n");
  }

  const sampleLines = params.pendingItems
    .slice(0, CHANGE_REQUEST_WEBHOOK_PENDING_ITEM_LIMIT)
    .map((item, index) => `${index + 1}. ${formatItemSummaryLine(item)}`);

  return [...headerLines, "- Sample items:", ...sampleLines].join("\n");
}

async function sendDiscordWebhook(
  webhookUrl: string,
  payload: DiscordWebhookPayload,
) {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = (await response.text().catch(() => "")).slice(0, 200);
    throw new Error(
      `Discord webhook failed (${response.status}): ${errorBody || "No response body"}`,
    );
  }
}

async function pushPendingItem(
  redis: RedisLike,
  item: ChangeRequestWebhookItemSummary,
) {
  await redis.lpush(CHANGE_REQUEST_WEBHOOK_KEYS.pendingItems, JSON.stringify(item));
  await redis.ltrim(
    CHANGE_REQUEST_WEBHOOK_KEYS.pendingItems,
    0,
    CHANGE_REQUEST_WEBHOOK_PENDING_ITEM_LIMIT - 1,
  );
}

async function queueForAggregate(
  redis: RedisLike,
  item: ChangeRequestWebhookItemSummary,
) {
  const pendingCount = await redis.incr(CHANGE_REQUEST_WEBHOOK_KEYS.pendingCount);
  await pushPendingItem(redis, item);
  return pendingCount;
}

async function initializeWindow(
  redis: RedisLike,
  nowIso: string,
): Promise<void> {
  await Promise.all([
    redis.set(CHANGE_REQUEST_WEBHOOK_KEYS.windowStartedAt, nowIso),
    redis.set(CHANGE_REQUEST_WEBHOOK_KEYS.pendingCount, "0"),
    redis.del(CHANGE_REQUEST_WEBHOOK_KEYS.pendingItems),
  ]);
}

async function clearPendingState(redis: RedisLike): Promise<void> {
  await redis.del(
    CHANGE_REQUEST_WEBHOOK_KEYS.pendingCount,
    CHANGE_REQUEST_WEBHOOK_KEYS.pendingItems,
    CHANGE_REQUEST_WEBHOOK_KEYS.windowStartedAt,
  );
}

export async function notifyChangeRequestModerators(
  item: ChangeRequestWebhookItemSummary,
  deps?: SharedDeps,
): Promise<NotifyChangeRequestModeratorsResult> {
  const webhookUrl = resolveWebhookUrl(deps);
  if (!webhookUrl) {
    console.info(
      "[change-request:webhook] skipped notify because DISCORD_CHANGE_REQUEST_WEBHOOK_URL is unset",
    );
    return { status: "skipped_no_webhook" };
  }

  const redis = getChangeRequestWebhookRedisClient(deps);
  const moderationUrl = resolveModerationUrl(deps);
  const sendWebhook = resolveWebhookSender(webhookUrl, deps);
  const nowIso = (deps?.now ?? new Date()).toISOString();

  const windowOpened = await redis.set(
    CHANGE_REQUEST_WEBHOOK_KEYS.windowActive,
    "1",
    {
      nx: true,
      ex: CHANGE_REQUEST_WEBHOOK_WINDOW_SECONDS,
    },
  );

  if (windowOpened) {
    await initializeWindow(redis, nowIso);
    try {
      await sendWebhook({
        username: "Sharply Change Requests",
        content: buildImmediateWebhookContent({ item, moderationUrl }),
      });
      console.info("[change-request:webhook] immediate sent", {
        proposalId: item.proposalId,
        gearId: item.gearId,
      });
      return { status: "sent_immediate" };
    } catch (error) {
      console.error("[change-request:webhook] immediate send failed", {
        proposalId: item.proposalId,
        gearId: item.gearId,
        error,
      });
      const pendingCount = await queueForAggregate(redis, item);
      return { status: "immediate_failed_queued", pendingCount };
    }
  }

  const pendingCount = await queueForAggregate(redis, item);
  console.info("[change-request:webhook] queued for aggregate", {
    proposalId: item.proposalId,
    gearId: item.gearId,
    pendingCount,
  });
  return { status: "queued_for_aggregate", pendingCount };
}

export async function flushChangeRequestModeratorWebhookAggregation(
  deps?: SharedDeps,
): Promise<FlushChangeRequestWebhookResult> {
  const webhookUrl = resolveWebhookUrl(deps);
  if (!webhookUrl) {
    console.info(
      "[change-request:webhook] skipped flush because DISCORD_CHANGE_REQUEST_WEBHOOK_URL is unset",
    );
    return { status: "skipped_no_webhook" };
  }

  const redis = getChangeRequestWebhookRedisClient(deps);
  const moderationUrl = resolveModerationUrl(deps);
  const sendWebhook = resolveWebhookSender(webhookUrl, deps);
  const lockValue = `${Date.now()}`;

  const lockAcquired = await redis.set(
    CHANGE_REQUEST_WEBHOOK_KEYS.flushLock,
    lockValue,
    {
      nx: true,
      ex: CHANGE_REQUEST_WEBHOOK_FLUSH_LOCK_SECONDS,
    },
  );

  if (!lockAcquired) {
    return { status: "lock_not_acquired" };
  }

  const hasActiveWindow =
    (await redis.exists(CHANGE_REQUEST_WEBHOOK_KEYS.windowActive)) > 0;
  if (hasActiveWindow) {
    return { status: "window_active" };
  }

  const [pendingRaw, windowStartedAtRaw, pendingItemRows] = await Promise.all([
    redis.get(CHANGE_REQUEST_WEBHOOK_KEYS.pendingCount),
    redis.get<string>(CHANGE_REQUEST_WEBHOOK_KEYS.windowStartedAt),
    redis.lrange<string>(
      CHANGE_REQUEST_WEBHOOK_KEYS.pendingItems,
      0,
      CHANGE_REQUEST_WEBHOOK_PENDING_ITEM_LIMIT - 1,
    ),
  ]);

  const pendingCount = toPositiveInt(pendingRaw);
  if (pendingCount <= 0) {
    await clearPendingState(redis);
    return { status: "no_pending" };
  }

  const pendingItems = parsePendingItems(pendingItemRows ?? []);
  await sendWebhook({
    username: "Sharply Change Requests",
    content: buildAggregatedWebhookContent({
      pendingCount,
      pendingItems,
      moderationUrl,
      windowStartedAt:
        typeof windowStartedAtRaw === "string" ? windowStartedAtRaw : null,
    }),
  });

  await clearPendingState(redis);
  console.info("[change-request:webhook] aggregate sent", {
    pendingCount,
    sampleCount: pendingItems.length,
  });
  return { status: "sent_aggregate", pendingCount };
}
