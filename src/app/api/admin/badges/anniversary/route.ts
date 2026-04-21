import { NextResponse } from "next/server";
import { env } from "~/env";
import { evaluateForEvent } from "~/server/badges/service";
import { fetchUsersWithAnniversaryToday } from "~/server/users/service";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    console.warn("[badges-cron] anniversary unauthorized request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = new Date();
  console.log("[badges-cron] anniversary start", startedAt.toISOString());

  const rows = await fetchUsersWithAnniversaryToday();

  console.log("[badges-cron] users to process:", rows.length);
  let processed = 0;
  let totalAwards = 0;
  const now = Date.now();
  for (const r of rows) {
    processed++;
    try {
      const res = await evaluateForEvent(
        { type: "cron.anniversary", context: { now } },
        r.id,
      );
      totalAwards += res.awarded.length;
      console.log(
        "[badges-cron] user processed",
        r.id,
        "awarded:",
        res.awarded.length > 0 ? res.awarded.join(",") : "-",
      );
    } catch (err) {
      console.error("[badges-cron] user error", r.id, err);
    }
  }

  const endedAt = new Date();
  console.log("[badges-cron] anniversary end", endedAt.toISOString(), {
    processed,
    totalAwards,
  });

  return NextResponse.json({ ok: true, processed, totalAwards });
}
