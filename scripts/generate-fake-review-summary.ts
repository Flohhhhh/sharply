#!/usr/bin/env tsx
import "dotenv/config";
/*
  Generate a fake review summary for a gear item by slug.
  Usage:
    tsx scripts/generate-fake-review-summary.ts --slug nikon-z6 --use-sample --backdate-days 8
*/

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "~/server/db";
import { gear } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { backdateSummaryTimestamp } from "~/server/reviews/summary/data";
import { generateReviewSummaryFromProvidedReviews } from "~/server/reviews/summary/service";

type ReviewLike = {
  content: string;
  recommend: boolean | null;
  genres: string[] | null;
};

function parseArgs(argv: string[]) {
  const args: Record<string, string | boolean | number> = {};
  const toValue = (v: string) => (!Number.isNaN(Number(v)) ? Number(v) : v);
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (!a) continue;
    if (!a.startsWith("--")) continue;
    const body = a.slice(2);
    if (body.includes("=")) {
      const [kRaw, vRaw] = body.split("=", 2);
      const k = String(kRaw);
      const v = vRaw ?? "";
      args[k] = toValue(v);
    } else {
      const k = body;
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        args[k] = toValue(next);
        i++;
      } else {
        args[k] = true;
      }
    }
  }
  return args as {
    slug?: string;
    useSample?: boolean;
    backdateDays?: number;
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const slug = args.slug;
  if (!slug) throw new Error("--slug is required");

  const rawUseSample = (args as any)["use-sample"] ?? args.useSample;
  const useSample =
    rawUseSample === true ||
    rawUseSample === "true" ||
    rawUseSample === 1 ||
    rawUseSample === "1";

  const backdateDays = Number(
    (args as any)["backdate-days"] ?? args.backdateDays ?? 0,
  );

  const rows = await db
    .select({ id: gear.id, name: gear.name })
    .from(gear)
    .where(eq(gear.slug, slug))
    .limit(1);
  const g = rows[0];
  if (!g) throw new Error(`Gear not found for slug: ${slug}`);
  console.log("[ai-summary:script] target gear", {
    slug,
    gearId: g.id,
    gearName: g.name,
  });

  let sample: ReviewLike[] = [];
  if (useSample) {
    console.log("[ai-summary:script] using sample reviews JSON");
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const samplePath = path.resolve(
      __dirname,
      "../src/server/reviews/summary/sample-reviews.json",
    );
    const raw = readFileSync(samplePath, "utf8");
    const json = JSON.parse(raw) as ReviewLike[];
    sample = json.map((r) => ({
      content: r.content,
      recommend: r.recommend ?? null,
      genres: (r.genres ?? null) as string[] | null,
    }));
    console.log("[ai-summary:script] sample loaded", { items: sample.length });
  } else {
    throw new Error(
      "--use-sample currently required to avoid hitting DB for real reviews in this script",
    );
  }

  console.log("[ai-summary:script] generating summary via OpenAI", {
    model: "gpt-4.1-mini",
    sampleSize: sample.length,
  });
  const text = await generateReviewSummaryFromProvidedReviews({
    gearId: g.id,
    gearName: g.name,
    reviews: sample,
  });

  if (backdateDays && backdateDays > 0) {
    console.log("[ai-summary:script] backdating updated_at", {
      days: backdateDays,
    });
    await backdateSummaryTimestamp(g.id, backdateDays);
  }

  // eslint-disable-next-line no-console
  console.log("Generated summary:\n\n" + text + "\n");
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
