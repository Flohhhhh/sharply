/**
 * Shared guard for e2e-only scripts that write to the database: refuses to
 * run unless DATABASE_URL points at the disposable local e2e database.
 *
 * Both scripts/e2e/seed-fixtures.ts (writes a SUPERADMIN user, invites, etc.
 * via drizzle) and scripts/e2e/bootstrap-payload.ts (writes published content
 * via the Payload Local API) must never touch dev/prod — some environments
 * (see AGENTS.md) inject a DATABASE_URL pointing at a Neon preview branch
 * derived from production.
 *
 * Host alone isn't enough to identify the target: requires BOTH
 *  - hostname is localhost/127.0.0.1 (CI uses :5432, setup-local uses :5433)
 *  - database name (URL pathname) is exactly "sharply_e2e"
 * so the guard also refuses a same-host DB with a different name.
 */
export function assertLocalDatabase(scriptTag: string) {
  let hostname = "";
  let dbName = "";
  try {
    const url = new URL(process.env.DATABASE_URL ?? "");
    hostname = url.hostname;
    dbName = url.pathname.replace(/^\//, "");
  } catch {
    // Leave both empty; an unset/unparseable DATABASE_URL falls through to
    // the refusal below same as a bad host or db name would.
  }
  const hostOk = hostname === "localhost" || hostname === "127.0.0.1";
  const dbOk = dbName === "sharply_e2e";
  if (!hostOk || !dbOk) {
    console.error(
      `[${scriptTag}] refusing to run: DATABASE_URL host "${hostname || "(unset/unparseable)"}" / database "${dbName || "(unset/unparseable)"}" is not localhost|127.0.0.1/sharply_e2e — this script writes data and must only target the local e2e database.`,
    );
    process.exit(1);
  }
}
