export const runtime = "nodejs";
export const maxDuration = 300; // seconds

import { NextRequest, NextResponse } from "next/server";
import { env } from "~/env";
import { runDailyPopularityRollup } from "~/server/popularity/rollup";

async function handleRollup(request: NextRequest) {
  try {
    // Secured per Vercel Cron guide: Authorization: Bearer <CRON_SECRET>
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("Popularity rollup started");
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") ?? undefined;
    const { asOfDate } = await runDailyPopularityRollup(date);
    console.log("Popularity rollup completed");
    return NextResponse.json({ ok: true, asOfDate });
  } catch (error) {
    console.error("Popularity rollup failed", error);
    const message = error instanceof Error ? error.message : "Rollup failed";
    const payload =
      env.NODE_ENV === "production"
        ? { ok: false, error: "Rollup failed" }
        : { ok: false, error: message };
    return NextResponse.json(payload, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handleRollup(request);
}

export async function POST(request: NextRequest) {
  return handleRollup(request);
}
