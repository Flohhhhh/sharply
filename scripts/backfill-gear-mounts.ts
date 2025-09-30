/**
 * Backfill script for gear_mounts table
 *
 * Populates gear_mounts from existing gear.mountId values.
 * Run this AFTER the migration that creates the gear_mounts table.
 *
 * Usage:
 *   npx tsx scripts/backfill-gear-mounts.ts
 */

import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";

async function backfillGearMounts() {
  console.log("[backfill-gear-mounts] Starting backfill...");

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL is required to run this script");
  }

  const client = postgres(dbUrl, { max: 1 });
  const db = drizzle(client);

  // Insert into gear_mounts from existing gear.mountId and count inserted rows
  const inserted = await db.execute(sql`
    INSERT INTO app.gear_mounts (gear_id, mount_id, created_at)
    SELECT id, mount_id, now()
    FROM app.gear
    WHERE mount_id IS NOT NULL
    ON CONFLICT (gear_id, mount_id) DO NOTHING
    RETURNING 1 AS inserted
  `);

  console.log(
    `[backfill-gear-mounts] Backfilled ${inserted.length} mount mappings`,
  );

  // Verify: count total gear_mounts rows
  const total = await db.execute(
    sql`SELECT count(*)::int AS c FROM app.gear_mounts`,
  );
  console.log(
    `[backfill-gear-mounts] Total gear_mounts rows: ${(total as any)[0]?.c ?? 0}`,
  );

  // Verify: count gear with mountId
  const gearCount = await db.execute(
    sql`SELECT count(*)::int AS c FROM app.gear WHERE mount_id IS NOT NULL`,
  );
  console.log(
    `[backfill-gear-mounts] Gear with mountId: ${(gearCount as any)[0]?.c ?? 0}`,
  );

  console.log("[backfill-gear-mounts] Backfill complete!");
  await client.end({ timeout: 5 });
}

backfillGearMounts()
  .then(() => {
    console.log("[backfill-gear-mounts] Success");
    process.exit(0);
  })
  .catch((error) => {
    console.error("[backfill-gear-mounts] Error:", error);
    process.exit(1);
  });
