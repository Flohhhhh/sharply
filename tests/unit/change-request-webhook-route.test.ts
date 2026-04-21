import { beforeEach,describe,expect,it,vi } from "vitest";

const envMocks = vi.hoisted(() => ({
  env: {
    CRON_SECRET: "cron-secret",
    NODE_ENV: "test",
  },
}));

const webhookMocks = vi.hoisted(() => ({
  flushChangeRequestModeratorWebhookAggregation: vi.fn(),
}));

vi.mock("~/env", () => envMocks);
vi.mock("~/server/admin/proposals/webhook", () => webhookMocks);

import {
  GET,
  POST,
} from "../../src/app/api/admin/proposals/webhook/flush/route";

describe("change request webhook flush route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    webhookMocks.flushChangeRequestModeratorWebhookAggregation.mockResolvedValue({
      status: "no_pending",
    });
  });

  it("returns 401 without the cron bearer token", async () => {
    const response = await GET(
      new Request("http://localhost/api/admin/proposals/webhook/flush") as any,
    );
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toEqual({ error: "Unauthorized" });
    expect(
      webhookMocks.flushChangeRequestModeratorWebhookAggregation,
    ).not.toHaveBeenCalled();
  });

  it("allows authorized POST and returns flush result", async () => {
    webhookMocks.flushChangeRequestModeratorWebhookAggregation.mockResolvedValue({
      status: "sent_aggregate",
      pendingCount: 3,
    });

    const response = await POST(
      new Request("http://localhost/api/admin/proposals/webhook/flush", {
        method: "POST",
        headers: { Authorization: "Bearer cron-secret" },
      }) as any,
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      ok: true,
      result: { status: "sent_aggregate", pendingCount: 3 },
    });
    expect(
      webhookMocks.flushChangeRequestModeratorWebhookAggregation,
    ).toHaveBeenCalledTimes(1);
  });
});
