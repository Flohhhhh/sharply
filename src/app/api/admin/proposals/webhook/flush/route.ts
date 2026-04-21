export const runtime = "nodejs";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { env } from "~/env";
import { flushChangeRequestModeratorWebhookAggregation } from "~/server/admin/proposals/webhook";

async function handleFlush(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await flushChangeRequestModeratorWebhookAggregation();
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error("[change-request:webhook-cron] flush failed", error);
    const message = error instanceof Error ? error.message : "Flush failed";
    const payload =
      env.NODE_ENV === "production"
        ? { ok: false, error: "Flush failed" }
        : { ok: false, error: message };
    return NextResponse.json(payload, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handleFlush(request);
}

export async function POST(request: NextRequest) {
  return handleFlush(request);
}
