if (process.env.NEXT_RUNTIME) {
  import("server-only").catch(() => undefined);
}

import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  DEVELOPER_API_RATE_LIMIT,
  type DeveloperApiEndpoint,
} from "./constants";
import { DeveloperApiError } from "./errors";
import {
  authenticateDeveloperApiKey,
  consumeDeveloperRateLimit,
  recordDeveloperApiUsage,
} from "./service";

type SuccessfulResponse = {
  data: unknown;
  pagination?: unknown;
  headers?: Record<string, string>;
};

function buildRateLimitHeaders(params?: { remaining: number; resetAt: Date }) {
  if (!params) return undefined;
  return {
    "X-RateLimit-Limit": String(DEVELOPER_API_RATE_LIMIT),
    "X-RateLimit-Remaining": String(params.remaining),
    "X-RateLimit-Reset": String(Math.floor(params.resetAt.getTime() / 1000)),
  };
}

function errorResponse(params: {
  requestId: string;
  error: unknown;
  rateLimit?: { remaining: number; resetAt: Date };
}) {
  const known = params.error instanceof DeveloperApiError ? params.error : null;
  const statusFromError = (params.error as { status?: number } | null)?.status;
  const status = known?.status ?? statusFromError ?? 500;
  const code = known?.code ?? (status === 404 ? "not_found" : "internal_error");
  const message =
    known?.message ??
    (status === 404
      ? "The requested resource was not found."
      : "An unexpected error occurred.");

  return NextResponse.json(
    { error: { code, message }, meta: { requestId: params.requestId } },
    {
      status,
      headers: {
        "X-Request-Id": params.requestId,
        ...buildRateLimitHeaders(params.rateLimit),
      },
    },
  );
}

async function recordUsageBestEffort(params: {
  apiKeyId: string;
  endpoint: DeveloperApiEndpoint;
}) {
  try {
    await recordDeveloperApiUsage(params);
  } catch (error) {
    console.error("Developer API usage recording failed:", error);
  }
}

export async function runDeveloperApiRequest(
  request: Request,
  endpoint: DeveloperApiEndpoint,
  handler: () => Promise<SuccessfulResponse>,
) {
  const requestId = randomUUID();
  let credential: Awaited<
    ReturnType<typeof authenticateDeveloperApiKey>
  > | null = null;
  let rateLimit:
    | Awaited<ReturnType<typeof consumeDeveloperRateLimit>>
    | undefined;

  try {
    credential = await authenticateDeveloperApiKey(
      request.headers.get("authorization"),
    );
    rateLimit = await consumeDeveloperRateLimit(credential.apiKeyId);
    if (!rateLimit.allowed) {
      throw new DeveloperApiError(
        "rate_limit_exceeded",
        429,
        "Rate limit exceeded. Try again after the reset time.",
      );
    }

    const response = await handler();
    await recordUsageBestEffort({ apiKeyId: credential.apiKeyId, endpoint });
    const { headers, ...body } = response;
    return NextResponse.json(
      { ...body, meta: { requestId } },
      {
        headers: {
          ...headers,
          "X-Request-Id": requestId,
          ...buildRateLimitHeaders(rateLimit),
        },
      },
    );
  } catch (error) {
    if (credential && rateLimit?.allowed) {
      await recordUsageBestEffort({
        apiKeyId: credential.apiKeyId,
        endpoint,
      });
    }
    if (!(error instanceof DeveloperApiError) || error.status >= 500) {
      console.error(`Developer API ${endpoint} error:`, error);
    }
    return errorResponse({ requestId, error, rateLimit });
  }
}
