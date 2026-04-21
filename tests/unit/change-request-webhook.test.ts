/*
These tests verify the change-request moderator webhook aggregation contract.
They cover immediate send, aggregate queueing, lock behavior, and failure retries.
If these fail, moderator notifications may be duplicated, dropped, or delayed.
*/

import { describe,expect,it,vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("~/env", () => ({
  env: {
    DISCORD_CHANGE_REQUEST_WEBHOOK_URL: undefined,
    NEXT_PUBLIC_BASE_URL: "https://sharply.example",
    NODE_ENV: "test",
  },
}));

import {
  CHANGE_REQUEST_WEBHOOK_KEYS,
  flushChangeRequestModeratorWebhookAggregation,
  notifyChangeRequestModerators,
  type ChangeRequestWebhookItemSummary,
} from "~/server/admin/proposals/webhook";

type RedisSetOptions = {
  nx?: boolean;
  ex?: number;
};

class FakeRedis {
  private nowMs = 0;
  private data = new Map<string, { value: unknown; expireAtMs: number | null }>();

  advanceByMs(ms: number) {
    this.nowMs += ms;
    this.sweepExpired();
  }

  async set(key: string, value: string, options?: RedisSetOptions) {
    this.sweepExpired();
    const existing = this.data.get(key);
    if (options?.nx && existing) {
      return null;
    }

    this.data.set(key, {
      value,
      expireAtMs: options?.ex ? this.nowMs + options.ex * 1000 : null,
    });
    return "OK";
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    this.sweepExpired();
    if (!this.data.has(key)) return null;
    return this.data.get(key)!.value as T;
  }

  async exists(key: string) {
    this.sweepExpired();
    return this.data.has(key) ? 1 : 0;
  }

  async incr(key: string) {
    this.sweepExpired();
    const current = Number((await this.get<string | number>(key)) ?? 0);
    const next = (Number.isFinite(current) ? current : 0) + 1;
    this.data.set(key, { value: String(next), expireAtMs: null });
    return next;
  }

  async del(...keys: string[]) {
    this.sweepExpired();
    let removed = 0;
    for (const key of keys) {
      if (this.data.delete(key)) {
        removed += 1;
      }
    }
    return removed;
  }

  async lpush(key: string, ...elements: string[]) {
    this.sweepExpired();
    const existing = (await this.get<string[]>(key)) ?? [];
    const list = [...existing];
    for (const element of elements) {
      list.unshift(element);
    }
    this.data.set(key, { value: list, expireAtMs: null });
    return list.length;
  }

  async ltrim(key: string, start: number, stop: number) {
    this.sweepExpired();
    const existing = (await this.get<string[]>(key)) ?? [];
    const normalizedStop = stop < 0 ? existing.length + stop : stop;
    const next = existing.slice(start, normalizedStop + 1);
    this.data.set(key, { value: next, expireAtMs: null });
    return "OK";
  }

  async lrange<T = string>(key: string, start: number, stop: number): Promise<T[]> {
    this.sweepExpired();
    const existing = ((await this.get<T[]>(key)) ?? []) as T[];
    if (existing.length === 0) return [];
    const normalizedStop = stop < 0 ? existing.length + stop : stop;
    return existing.slice(start, normalizedStop + 1);
  }

  private sweepExpired() {
    for (const [key, row] of this.data) {
      if (row.expireAtMs !== null && row.expireAtMs <= this.nowMs) {
        this.data.delete(key);
      }
    }
  }
}

const baseItem: ChangeRequestWebhookItemSummary = {
  proposalId: "11111111-1111-4111-8111-111111111111",
  gearId: "22222222-2222-4222-8222-222222222222",
  gearType: "CAMERA",
  gearName: "Nikon Z6 III",
  gearSlug: "nikon-z6-iii",
  createdByLabel: "Alex Photographer",
  changedFieldCount: 3,
  changedSectionCount: 1,
  hasNote: true,
};

function makeItem(overrides: Partial<ChangeRequestWebhookItemSummary> = {}) {
  return { ...baseItem, ...overrides };
}

const webhookUrl = "https://discord.example/webhook";
const moderationUrl = "https://sharply.example/admin";

describe("change request webhook aggregation", () => {
  it("sends immediate webhook for first request and initializes a window", async () => {
    const redis = new FakeRedis();
    const sendWebhook = vi.fn().mockResolvedValue(undefined);

    const result = await notifyChangeRequestModerators(makeItem(), {
      redis,
      sendWebhook,
      webhookUrl,
      moderationUrl,
    });

    expect(result).toEqual({ status: "sent_immediate" });
    expect(sendWebhook).toHaveBeenCalledTimes(1);
    expect(sendWebhook).toHaveBeenCalledWith({
      username: "Sharply Change Requests",
      content: [
        "**New change request submitted**",
        "- Gear: Nikon Z6 III (CAMERA)",
        "- Changes: 3 fields across 1 section",
        "- Submitted by: Alex Photographer",
        "- Submitter note: included",
        "-# Proposal: `11111111`",
        "-# Admin: <https://sharply.example/admin>",
      ].join("\n"),
    });
    expect(await redis.get(CHANGE_REQUEST_WEBHOOK_KEYS.windowActive)).toBe("1");
    expect(await redis.get(CHANGE_REQUEST_WEBHOOK_KEYS.pendingCount)).toBe("0");
  });

  it("queues additional requests during an active window", async () => {
    const redis = new FakeRedis();
    const sendWebhook = vi.fn().mockResolvedValue(undefined);

    await notifyChangeRequestModerators(makeItem(), {
      redis,
      sendWebhook,
      webhookUrl,
      moderationUrl,
    });
    const result = await notifyChangeRequestModerators(
      makeItem({ proposalId: "33333333-3333-4333-8333-333333333333" }),
      {
        redis,
        sendWebhook,
        webhookUrl,
        moderationUrl,
      },
    );

    expect(result).toEqual({ status: "queued_for_aggregate", pendingCount: 1 });
    expect(sendWebhook).toHaveBeenCalledTimes(1);
    const samples = await redis.lrange<string>(
      CHANGE_REQUEST_WEBHOOK_KEYS.pendingItems,
      0,
      -1,
    );
    expect(samples.length).toBe(1);
  });

  it("allows only one immediate sender under concurrent submissions", async () => {
    const redis = new FakeRedis();
    const sendWebhook = vi.fn().mockResolvedValue(undefined);

    const [a, b] = await Promise.all([
      notifyChangeRequestModerators(
        makeItem({ proposalId: "44444444-4444-4444-8444-444444444444" }),
        { redis, sendWebhook, webhookUrl, moderationUrl },
      ),
      notifyChangeRequestModerators(
        makeItem({ proposalId: "55555555-5555-4555-8555-555555555555" }),
        { redis, sendWebhook, webhookUrl, moderationUrl },
      ),
    ]);

    const statuses = [a.status, b.status].sort();
    expect(statuses).toEqual(["queued_for_aggregate", "sent_immediate"]);
    expect(sendWebhook).toHaveBeenCalledTimes(1);
    expect(await redis.get(CHANGE_REQUEST_WEBHOOK_KEYS.pendingCount)).toBe("1");
  });

  it("queues the initial request when immediate webhook send fails", async () => {
    const redis = new FakeRedis();
    const sendWebhook = vi.fn().mockRejectedValue(new Error("network"));

    const result = await notifyChangeRequestModerators(makeItem(), {
      redis,
      sendWebhook,
      webhookUrl,
      moderationUrl,
    });

    expect(result).toEqual({ status: "immediate_failed_queued", pendingCount: 1 });
    expect(await redis.get(CHANGE_REQUEST_WEBHOOK_KEYS.pendingCount)).toBe("1");
    const samples = await redis.lrange<string>(
      CHANGE_REQUEST_WEBHOOK_KEYS.pendingItems,
      0,
      -1,
    );
    expect(samples.length).toBe(1);
  });

  it("exits flush when aggregation window is still active", async () => {
    const redis = new FakeRedis();
    const sendWebhook = vi.fn().mockResolvedValue(undefined);

    await notifyChangeRequestModerators(makeItem(), {
      redis,
      sendWebhook,
      webhookUrl,
      moderationUrl,
    });

    const result = await flushChangeRequestModeratorWebhookAggregation({
      redis,
      sendWebhook,
      webhookUrl,
      moderationUrl,
    });

    expect(result).toEqual({ status: "window_active" });
    expect(sendWebhook).toHaveBeenCalledTimes(1);
  });

  it("sends one aggregate webhook after window expiry and clears pending state", async () => {
    const redis = new FakeRedis();
    const sendWebhook = vi.fn().mockResolvedValue(undefined);

    await notifyChangeRequestModerators(makeItem(), {
      redis,
      sendWebhook,
      webhookUrl,
      moderationUrl,
    });
    await notifyChangeRequestModerators(
      makeItem({ proposalId: "66666666-6666-4666-8666-666666666666" }),
      {
        redis,
        sendWebhook,
        webhookUrl,
        moderationUrl,
      },
    );
    await notifyChangeRequestModerators(
      makeItem({ proposalId: "77777777-7777-4777-8777-777777777777" }),
      {
        redis,
        sendWebhook,
        webhookUrl,
        moderationUrl,
      },
    );

    redis.advanceByMs(61 * 60 * 1000);

    const result = await flushChangeRequestModeratorWebhookAggregation({
      redis,
      sendWebhook,
      webhookUrl,
      moderationUrl,
    });

    expect(result).toEqual({ status: "sent_aggregate", pendingCount: 2 });
    expect(sendWebhook).toHaveBeenCalledTimes(2);
    const aggregatePayload = sendWebhook.mock.calls[1]?.[0];
    expect(aggregatePayload?.username).toBe("Sharply Change Requests");
    expect(aggregatePayload?.content).toContain("**Change request summary**");
    expect(aggregatePayload?.content).toContain(
      "- 2 pending requests in the last 60-minute window",
    );
    expect(aggregatePayload?.content).toContain("- Window started: ");
    expect(aggregatePayload?.content).toContain(
      "1. Nikon Z6 III (CAMERA) • 3 fields across 1 section • by Alex Photographer • note included",
    );
    expect(aggregatePayload?.content).toContain(
      "2. Nikon Z6 III (CAMERA) • 3 fields across 1 section • by Alex Photographer • note included",
    );
    expect(aggregatePayload?.content).toContain(
      "-# Admin: <https://sharply.example/admin>",
    );
    expect(await redis.get(CHANGE_REQUEST_WEBHOOK_KEYS.pendingCount)).toBeNull();
    expect(await redis.get(CHANGE_REQUEST_WEBHOOK_KEYS.windowStartedAt)).toBeNull();
  });

  it("clears stale state and sends nothing when pending count is zero", async () => {
    const redis = new FakeRedis();
    const sendWebhook = vi.fn().mockResolvedValue(undefined);

    await redis.set(CHANGE_REQUEST_WEBHOOK_KEYS.pendingCount, "0");
    await redis.set(
      CHANGE_REQUEST_WEBHOOK_KEYS.windowStartedAt,
      "2026-03-11T10:00:00.000Z",
    );

    const result = await flushChangeRequestModeratorWebhookAggregation({
      redis,
      sendWebhook,
      webhookUrl,
      moderationUrl,
    });

    expect(result).toEqual({ status: "no_pending" });
    expect(sendWebhook).not.toHaveBeenCalled();
    expect(await redis.get(CHANGE_REQUEST_WEBHOOK_KEYS.pendingCount)).toBeNull();
    expect(await redis.get(CHANGE_REQUEST_WEBHOOK_KEYS.windowStartedAt)).toBeNull();
  });

  it("keeps pending state when aggregate webhook send fails", async () => {
    const redis = new FakeRedis();
    const sendWebhook = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("discord down"));

    await notifyChangeRequestModerators(makeItem(), {
      redis,
      sendWebhook,
      webhookUrl,
      moderationUrl,
    });
    await notifyChangeRequestModerators(
      makeItem({ proposalId: "88888888-8888-4888-8888-888888888888" }),
      {
        redis,
        sendWebhook,
        webhookUrl,
        moderationUrl,
      },
    );

    redis.advanceByMs(61 * 60 * 1000);

    await expect(
      flushChangeRequestModeratorWebhookAggregation({
        redis,
        sendWebhook,
        webhookUrl,
        moderationUrl,
      }),
    ).rejects.toThrow("discord down");

    expect(await redis.get(CHANGE_REQUEST_WEBHOOK_KEYS.pendingCount)).toBe("1");
    expect(await redis.get(CHANGE_REQUEST_WEBHOOK_KEYS.windowStartedAt)).not.toBeNull();
  });

  it("skips flush when another process already holds the flush lock", async () => {
    const redis = new FakeRedis();
    const sendWebhook = vi.fn().mockResolvedValue(undefined);

    await redis.set(CHANGE_REQUEST_WEBHOOK_KEYS.flushLock, "1", { ex: 120 });

    const result = await flushChangeRequestModeratorWebhookAggregation({
      redis,
      sendWebhook,
      webhookUrl,
      moderationUrl,
    });

    expect(result).toEqual({ status: "lock_not_acquired" });
    expect(sendWebhook).not.toHaveBeenCalled();
  });
});
