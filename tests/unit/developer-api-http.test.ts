import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeveloperApiError } from "~/server/developer-api/errors";

const serviceMocks = vi.hoisted(() => ({
  authenticateDeveloperApiKey: vi.fn(),
  consumeDeveloperRateLimit: vi.fn(),
  recordDeveloperApiUsage: vi.fn(),
}));

vi.mock("~/server/developer-api/service", () => serviceMocks);

import { runDeveloperApiRequest } from "~/server/developer-api/http";

describe("developer API HTTP wrapper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serviceMocks.authenticateDeveloperApiKey.mockResolvedValue({
      apiKeyId: "key-1",
    });
    serviceMocks.consumeDeveloperRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 59,
      resetAt: new Date("2025-01-01T00:01:00.000Z"),
    });
  });

  it("adds request and rate-limit metadata to successful responses", async () => {
    const response = await runDeveloperApiRequest(
      new Request("https://sharply.test/api/v1/search", {
        headers: { authorization: "Bearer sharply_live_test" },
      }),
      "search",
      async () => ({ data: [] }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("59");
    expect((await response.json()).meta.requestId).toBeTruthy();
    expect(serviceMocks.recordDeveloperApiUsage).toHaveBeenCalledWith({
      apiKeyId: "key-1",
      endpoint: "search",
    });
  });

  it("returns a successful response when usage recording fails", async () => {
    const logError = vi.spyOn(console, "error").mockImplementation(() => {});
    serviceMocks.recordDeveloperApiUsage.mockRejectedValueOnce(
      new Error("usage database unavailable"),
    );

    const response = await runDeveloperApiRequest(
      new Request("https://sharply.test/api/v1/search"),
      "search",
      async () => ({ data: [] }),
    );

    expect(response.status).toBe(200);
    expect(serviceMocks.recordDeveloperApiUsage).toHaveBeenCalledTimes(1);
    expect(logError).toHaveBeenCalledWith(
      "Developer API usage recording failed:",
      expect.any(Error),
    );
    await expect(response.json()).resolves.toMatchObject({ data: [] });
    logError.mockRestore();
  });

  it("passes through native 304 responses with request and rate-limit headers", async () => {
    const response = await runDeveloperApiRequest(
      new Request("https://sharply.test/api/v1/catalog"),
      "catalog",
      async () => ({
        response: new Response(null, {
          status: 304,
          headers: { ETag: '"sha256-catalog"' },
        }),
      }),
    );

    expect(response.status).toBe(304);
    expect(response.headers.get("ETag")).toBe('"sha256-catalog"');
    expect(response.headers.get("X-Request-Id")).toBeTruthy();
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("59");
    expect(serviceMocks.recordDeveloperApiUsage).toHaveBeenCalledWith({
      apiKeyId: "key-1",
      endpoint: "catalog",
    });
  });

  it("returns a consistent 429 without recording usage", async () => {
    serviceMocks.consumeDeveloperRateLimit.mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetAt: new Date("2025-01-01T00:01:00.000Z"),
    });

    const response = await runDeveloperApiRequest(
      new Request("https://sharply.test/api/v1/search"),
      "search",
      async () => ({ data: [] }),
    );

    expect(response.status).toBe(429);
    expect((await response.json()).error.code).toBe("rate_limit_exceeded");
    expect(serviceMocks.recordDeveloperApiUsage).not.toHaveBeenCalled();
  });

  it("preserves public input errors and records authenticated requests", async () => {
    const response = await runDeveloperApiRequest(
      new Request("https://sharply.test/api/v1/search"),
      "search",
      async () => {
        throw new DeveloperApiError("invalid_request", 400, "Invalid query");
      },
    );

    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("invalid_request");
    expect(serviceMocks.recordDeveloperApiUsage).toHaveBeenCalledTimes(1);
  });
});
