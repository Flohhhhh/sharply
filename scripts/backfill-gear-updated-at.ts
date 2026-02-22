import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";

const MUTATING_AUDIT_ACTIONS = [
  "GEAR_RENAME",
  "GEAR_IMAGE_UPLOAD",
  "GEAR_IMAGE_REPLACE",
  "GEAR_IMAGE_REMOVE",
  "GEAR_TOP_VIEW_UPLOAD",
  "GEAR_TOP_VIEW_REPLACE",
  "GEAR_TOP_VIEW_REMOVE",
  "GEAR_EDIT_APPROVE",
] as const;

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function fmt(value: unknown): string {
  return toDate(value)?.toISOString() ?? "n/a";
}

function parseArgs() {
  const apply = process.argv.includes("--apply");
  const sampleFlag = process.argv.find((arg) => arg.startsWith("--sample="));
  const samplePositional = process.argv.indexOf("--sample");
  const sampleRaw =
    sampleFlag?.split("=")[1] ??
    (samplePositional >= 0 ? process.argv[samplePositional + 1] : undefined);
  const sample = Number.parseInt(sampleRaw ?? "10", 10);
  return {
    apply,
    sample: Number.isFinite(sample) && sample > 0 ? sample : 10,
  };
}

const candidateUpdatesCte = sql.raw(`
  WITH candidate_updates AS (
    SELECT
      g.id,
      g.updated_at AS current_updated_at,
      GREATEST(
        g.updated_at,
        COALESCE(ga.max_updated_at, '-infinity'::timestamptz),
        COALESCE(cs.max_updated_at, '-infinity'::timestamptz),
        COALESCE(acs.max_updated_at, '-infinity'::timestamptz),
        COALESCE(ls.max_updated_at, '-infinity'::timestamptz),
        COALESCE(fls.max_updated_at, '-infinity'::timestamptz),
        COALESCE(cvm.max_updated_at, '-infinity'::timestamptz),
        COALESCE(ccs.max_updated_at, '-infinity'::timestamptz),
        COALESCE(caf.max_updated_at, '-infinity'::timestamptz),
        COALESCE(ucr.max_updated_at, '-infinity'::timestamptz),
        COALESCE(sv.max_updated_at, '-infinity'::timestamptz),
        COALESCE(rsu.max_updated_at, '-infinity'::timestamptz),
        COALESCE(grs.max_related_at, '-infinity'::timestamptz),
        COALESCE(gm.max_created_at, '-infinity'::timestamptz),
        COALESCE(ge.max_merged_at, '-infinity'::timestamptz),
        COALESCE(al.max_created_at, '-infinity'::timestamptz)
      ) AS next_updated_at
    FROM app.gear g
    LEFT JOIN LATERAL (
      SELECT max(updated_at) AS max_updated_at
      FROM app.gear_aliases ga
      WHERE ga.gear_id = g.id
    ) ga ON true
    LEFT JOIN LATERAL (
      SELECT max(updated_at) AS max_updated_at
      FROM app.camera_specs cs
      WHERE cs.gear_id = g.id
    ) cs ON true
    LEFT JOIN LATERAL (
      SELECT max(updated_at) AS max_updated_at
      FROM app.analog_camera_specs acs
      WHERE acs.gear_id = g.id
    ) acs ON true
    LEFT JOIN LATERAL (
      SELECT max(updated_at) AS max_updated_at
      FROM app.lens_specs ls
      WHERE ls.gear_id = g.id
    ) ls ON true
    LEFT JOIN LATERAL (
      SELECT max(updated_at) AS max_updated_at
      FROM app.fixed_lens_specs fls
      WHERE fls.gear_id = g.id
    ) fls ON true
    LEFT JOIN LATERAL (
      SELECT max(updated_at) AS max_updated_at
      FROM app.camera_video_modes cvm
      WHERE cvm.gear_id = g.id
    ) cvm ON true
    LEFT JOIN LATERAL (
      SELECT max(updated_at) AS max_updated_at
      FROM app.camera_card_slots ccs
      WHERE ccs.gear_id::text = g.id
    ) ccs ON true
    LEFT JOIN LATERAL (
      SELECT max(updated_at) AS max_updated_at
      FROM app.camera_af_area_specs caf
      WHERE caf.gear_id = g.id
    ) caf ON true
    LEFT JOIN LATERAL (
      SELECT max(updated_at) AS max_updated_at
      FROM app.use_case_ratings ucr
      WHERE ucr.gear_id = g.id
    ) ucr ON true
    LEFT JOIN LATERAL (
      SELECT max(updated_at) AS max_updated_at
      FROM app.staff_verdicts sv
      WHERE sv.gear_id = g.id
    ) sv ON true
    LEFT JOIN LATERAL (
      SELECT max(updated_at) AS max_updated_at
      FROM app.review_summaries rsu
      WHERE rsu.gear_id = g.id
    ) rsu ON true
    LEFT JOIN LATERAL (
      SELECT max(GREATEST(rs.updated_at, grs.created_at)) AS max_related_at
      FROM app.gear_raw_samples grs
      JOIN app.raw_samples rs ON rs.id = grs.raw_sample_id
      WHERE grs.gear_id = g.id
    ) grs ON true
    LEFT JOIN LATERAL (
      SELECT max(created_at) AS max_created_at
      FROM app.gear_mounts gm
      WHERE gm.gear_id = g.id
    ) gm ON true
    LEFT JOIN LATERAL (
      SELECT max(updated_at) AS max_merged_at
      FROM app.gear_edits ge
      WHERE ge.gear_id = g.id
        AND ge.status = 'MERGED'
    ) ge ON true
    LEFT JOIN LATERAL (
      SELECT max(created_at) AS max_created_at
      FROM app.audit_logs al
      WHERE al.gear_id = g.id
        AND al.action IN ('GEAR_RENAME', 'GEAR_IMAGE_UPLOAD', 'GEAR_IMAGE_REPLACE', 'GEAR_IMAGE_REMOVE', 'GEAR_TOP_VIEW_UPLOAD', 'GEAR_TOP_VIEW_REPLACE', 'GEAR_TOP_VIEW_REMOVE', 'GEAR_EDIT_APPROVE')
    ) al ON true
  )
`);

async function main() {
  const { apply, sample } = parseArgs();
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    throw new Error("DATABASE_URL is required to run this script");
  }

  const client = postgres(dbUrl, { max: 1 });
  const db = drizzle(client);

  console.log("[backfill-gear-updated-at] Starting...");
  console.log(
    `[backfill-gear-updated-at] Mode: ${apply ? "apply" : "dry-run"}`,
  );
  console.log(
    `[backfill-gear-updated-at] Mutating audit actions considered: ${MUTATING_AUDIT_ACTIONS.join(", ")}`,
  );

  const stats = (await db.execute(sql`
    ${candidateUpdatesCte}
    SELECT
      count(*)::int AS rows_to_update,
      min(current_updated_at) AS min_current_updated_at,
      max(next_updated_at) AS max_backfilled_updated_at
    FROM candidate_updates
    WHERE next_updated_at > current_updated_at
  `)) as Array<{
    rows_to_update: number;
    min_current_updated_at: Date | null;
    max_backfilled_updated_at: Date | null;
  }>;

  const rowsToUpdate = stats[0]?.rows_to_update ?? 0;
  const minCurrent = stats[0]?.min_current_updated_at ?? null;
  const maxBackfilled = stats[0]?.max_backfilled_updated_at ?? null;

  console.log(`[backfill-gear-updated-at] Rows needing update: ${rowsToUpdate}`);
  console.log(
    `[backfill-gear-updated-at] Oldest current timestamp among candidates: ${fmt(minCurrent)}`,
  );
  console.log(
    `[backfill-gear-updated-at] Newest candidate timestamp: ${fmt(maxBackfilled)}`,
  );

  if (rowsToUpdate > 0) {
    const sampleRows = (await db.execute(sql`
      ${candidateUpdatesCte}
      SELECT
        id,
        current_updated_at,
        next_updated_at
      FROM candidate_updates
      WHERE next_updated_at > current_updated_at
      ORDER BY next_updated_at DESC
      LIMIT ${sample}
    `)) as Array<{
      id: string;
      current_updated_at: Date;
      next_updated_at: Date;
    }>;

    console.log("[backfill-gear-updated-at] Sample rows:");
    for (const row of sampleRows) {
      console.log(
        `  ${row.id}: ${fmt(row.current_updated_at)} -> ${fmt(row.next_updated_at)}`,
      );
    }
  }

  if (!apply) {
    console.log(
      "[backfill-gear-updated-at] Dry run complete. Re-run with --apply to persist changes.",
    );
    await client.end({ timeout: 5 });
    return;
  }

  const updateResult = (await db.execute(sql`
    ${candidateUpdatesCte},
    updated AS (
      UPDATE app.gear g
      SET updated_at = c.next_updated_at
      FROM candidate_updates c
      WHERE g.id = c.id
        AND c.next_updated_at > c.current_updated_at
      RETURNING 1
    )
    SELECT count(*)::int AS updated_count
    FROM updated
  `)) as Array<{ updated_count: number }>;

  const updatedCount = updateResult[0]?.updated_count ?? 0;
  console.log(`[backfill-gear-updated-at] Updated rows: ${updatedCount}`);
  console.log("[backfill-gear-updated-at] Backfill complete.");

  await client.end({ timeout: 5 });
}

main().catch((error) => {
  console.error("[backfill-gear-updated-at] Error:", error);
  process.exit(1);
});
