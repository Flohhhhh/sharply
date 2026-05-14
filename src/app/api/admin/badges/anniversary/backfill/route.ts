export const runtime = "nodejs";
export const maxDuration = 300;

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { env } from "~/env";
import { runAnniversaryBackfill } from "~/server/badges/service";

function parseBoolean(value: string | null, defaultValue: boolean) {
  if (value === null) return defaultValue;
  if (value === "true") return true;
  if (value === "false") return false;
  return defaultValue;
}

function parsePositiveInteger(value: string | null): number | undefined {
  if (!value) return undefined;

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;

  return parsed;
}

async function handleBackfill(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dryRun = parseBoolean(searchParams.get("dryRun"), true);
    const limit = parsePositiveInteger(searchParams.get("limit"));

    const result = await runAnniversaryBackfill({
      dryRun,
      limit,
    });

    console.log("[badges-cron] anniversary backfill completed", {
      dryRun: result.dryRun,
      eligibleUsers: result.eligibleUsers,
      processedUsers: result.processedUsers,
      scannedUsers: result.scannedUsers,
      totalAwards: result.totalAwards,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[badges-cron] anniversary backfill failed", error);
    const message = error instanceof Error ? error.message : "Backfill failed";
    const payload =
      env.NODE_ENV === "production"
        ? { ok: false, error: "Backfill failed" }
        : { ok: false, error: message };
    return NextResponse.json(payload, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handleBackfill(request);
}

export async function POST(request: NextRequest) {
  return handleBackfill(request);
}
