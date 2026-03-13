import "dotenv/config";

import { cleanupDeletedRawSamples } from "../src/server/raw-samples/service";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function parseNumberArg(name: string): number | undefined {
  const equalsArg = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (equalsArg) {
    const value = Number.parseInt(equalsArg.split("=")[1] ?? "", 10);
    return Number.isFinite(value) ? value : undefined;
  }

  const positionalIndex = process.argv.indexOf(name);
  if (positionalIndex >= 0) {
    const value = Number.parseInt(process.argv[positionalIndex + 1] ?? "", 10);
    return Number.isFinite(value) ? value : undefined;
  }

  return undefined;
}

function parseArgs() {
  const apply = process.argv.includes("--apply");
  const limit = parseNumberArg("--limit") ?? 100;
  const olderThanDays = parseNumberArg("--older-than-days") ?? 0;

  return {
    apply,
    limit,
    olderThanDays: Math.max(olderThanDays, 0),
  };
}

async function main() {
  const { apply, limit, olderThanDays } = parseArgs();
  const deletedBefore = new Date(Date.now() - olderThanDays * DAY_IN_MS);

  console.log("[raw-samples:cleanup] Starting...");
  console.log(`[raw-samples:cleanup] Mode: ${apply ? "apply" : "dry-run"}`);
  console.log(`[raw-samples:cleanup] Limit: ${limit}`);
  console.log(
    `[raw-samples:cleanup] Deleted before: ${deletedBefore.toISOString()}`,
  );

  const result = await cleanupDeletedRawSamples({
    dryRun: !apply,
    limit,
    deletedBefore,
  });

  console.log(`[raw-samples:cleanup] Scanned: ${result.scanned}`);
  console.log(`[raw-samples:cleanup] Eligible: ${result.eligible}`);
  console.log(`[raw-samples:cleanup] Deleted: ${result.deleted}`);
  console.log(`[raw-samples:cleanup] Skipped: ${result.skipped}`);
  console.log(`[raw-samples:cleanup] Failed: ${result.failed}`);

  if (result.items.length > 0) {
    console.log("[raw-samples:cleanup] Item results:");
    for (const item of result.items) {
      const label = item.originalFilename ?? item.fileUrl;
      const suffix = item.error ? ` (${item.error})` : "";
      console.log(`  - ${item.id} ${item.status} ${label}${suffix}`);
    }
  }

  if (!apply) {
    console.log(
      "[raw-samples:cleanup] Dry run complete. Re-run with --apply to delete files and rows.",
    );
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("[raw-samples:cleanup] Error:", error);
    process.exit(1);
  });
