import { beforeEach, describe, expect, it, vi } from "vitest";

const envMocks = vi.hoisted(() => ({
  env: {
    CRON_SECRET: "cron-secret",
    NODE_ENV: "test",
  },
}));

const cleanupMocks = vi.hoisted(() => ({
  cleanupDeletedRawSamples: vi.fn(),
}));

vi.mock("~/env", () => envMocks);
vi.mock("~/server/raw-samples/service", () => cleanupMocks);

import {
  GET,
  POST,
} from "../../src/app/api/admin/raw-samples/cleanup/route";

describe("raw sample cleanup route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanupMocks.cleanupDeletedRawSamples.mockResolvedValue({
      dryRun: false,
      limit: 100,
      deletedBefore: new Date("2025-01-01T00:00:00.000Z"),
      scanned: 1,
      eligible: 1,
      deleted: 1,
      skipped: 0,
      failed: 0,
      items: [],
    });
  });

  it("returns 401 without the cron bearer token", async () => {
    const response = await GET(
      new Request("http://localhost/api/admin/raw-samples/cleanup") as any,
    );
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toEqual({ error: "Unauthorized" });
    expect(cleanupMocks.cleanupDeletedRawSamples).not.toHaveBeenCalled();
  });

  it("passes query params through on authorized GET", async () => {
    const response = await GET(
      new Request(
        "http://localhost/api/admin/raw-samples/cleanup?limit=5&olderThanDays=7",
        {
          headers: { Authorization: "Bearer cron-secret" },
        },
      ) as any,
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(cleanupMocks.cleanupDeletedRawSamples).toHaveBeenCalledTimes(1);
    expect(cleanupMocks.cleanupDeletedRawSamples).toHaveBeenCalledWith({
      dryRun: false,
      limit: 5,
      deletedBefore: expect.any(Date),
    });
  });

  it("allows authorized POST with default options", async () => {
    const response = await POST(
      new Request("http://localhost/api/admin/raw-samples/cleanup", {
        method: "POST",
        headers: { Authorization: "Bearer cron-secret" },
      }) as any,
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(cleanupMocks.cleanupDeletedRawSamples).toHaveBeenCalledWith({
      dryRun: false,
      limit: undefined,
      deletedBefore: undefined,
    });
  });
});
