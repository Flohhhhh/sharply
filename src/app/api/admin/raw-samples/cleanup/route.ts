export const runtime = "nodejs";
export const maxDuration = 300;

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { env } from "~/env";
import { cleanupDeletedRawSamples } from "~/server/raw-samples/service";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function parsePositiveInteger(value: string | null): number | undefined {
  if (!value) return undefined;

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;

  return parsed;
}

async function handleCleanup(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parsePositiveInteger(searchParams.get("limit"));
    const olderThanDays = parsePositiveInteger(searchParams.get("olderThanDays"));
    const deletedBefore =
      typeof olderThanDays === "number"
        ? new Date(Date.now() - olderThanDays * DAY_IN_MS)
        : undefined;

    const result = await cleanupDeletedRawSamples({
      dryRun: false,
      limit,
      deletedBefore,
    });

    console.log("[raw-samples-cleanup-cron] completed", {
      scanned: result.scanned,
      eligible: result.eligible,
      deleted: result.deleted,
      skipped: result.skipped,
      failed: result.failed,
    });

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error("[raw-samples-cleanup-cron] failed", error);
    const message = error instanceof Error ? error.message : "Cleanup failed";
    const payload =
      env.NODE_ENV === "production"
        ? { ok: false, error: "Cleanup failed" }
        : { ok: false, error: message };
    return NextResponse.json(payload, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handleCleanup(request);
}

export async function POST(request: NextRequest) {
  return handleCleanup(request);
}
