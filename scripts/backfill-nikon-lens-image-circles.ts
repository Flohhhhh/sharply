/**
 * Backfill Nikon LENS imageCircleSizeId from DX naming.
 *
 * Rule:
 *   - Brand slug `nikon`, gear_type `LENS`
 *   - Name contains whole-token "DX" (case-insensitive) → aps-c
 *   - Otherwise → full-frame
 *
 * Updates lens_specs only when the target differs from the current value.
 * Does not touch fixed_lens_specs or non-LENS gear.
 *
 * Usage:
 *   npm run gear:backfill-nikon-image-circles
 *   npm run gear:backfill-nikon-image-circles -- --apply
 *   npm run gear:backfill-nikon-image-circles -- --sample=30
 */

import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { targetImageCircleSlugFromNikonLensName } from "../src/lib/admin/nikon-lens-image-circle";
import {
  brands,
  gear,
  lensSpecs,
  sensorFormats,
} from "../src/server/db/schema";

const LOG_PREFIX = "[backfill-nikon-lens-image-circles]";

function parseArgs() {
  const apply = process.argv.includes("--apply");
  const sampleFlag = process.argv.find((arg) => arg.startsWith("--sample="));
  const samplePositional = process.argv.indexOf("--sample");
  const sampleRaw =
    sampleFlag?.split("=")[1] ??
    (samplePositional >= 0 ? process.argv[samplePositional + 1] : undefined);
  const sample = Number.parseInt(sampleRaw ?? "20", 10);
  return {
    apply,
    sample: Number.isFinite(sample) && sample > 0 ? sample : 20,
  };
}

type CandidateRow = {
  gearId: string;
  slug: string;
  name: string;
  currentImageCircleSizeId: string | null;
  currentImageCircleSlug: string | null;
  targetSlug: "aps-c" | "full-frame";
  targetImageCircleSizeId: string;
};

async function main() {
  const { apply, sample } = parseArgs();

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL is required to run this script");
  }

  console.log(`${LOG_PREFIX} Starting...`);
  console.log(`${LOG_PREFIX} Mode: ${apply ? "apply" : "dry-run"}`);

  const client = postgres(dbUrl, { max: 1 });
  const db = drizzle(client);

  try {
    const [nikonBrand] = await db
      .select({ id: brands.id, slug: brands.slug, name: brands.name })
      .from(brands)
      .where(eq(brands.slug, "nikon"))
      .limit(1);

    if (!nikonBrand) {
      throw new Error('Brand with slug "nikon" not found');
    }

    const allFormats = await db
      .select({
        id: sensorFormats.id,
        slug: sensorFormats.slug,
        name: sensorFormats.name,
      })
      .from(sensorFormats);

    const apsC = allFormats.find((row) => row.slug === "aps-c");
    const fullFrame = allFormats.find((row) => row.slug === "full-frame");

    if (!apsC || !fullFrame) {
      throw new Error(
        `Missing sensor formats: aps-c=${Boolean(apsC)}, full-frame=${Boolean(fullFrame)}`,
      );
    }

    const formatIdBySlug = {
      "aps-c": apsC.id,
      "full-frame": fullFrame.id,
    } as const;

    const slugByFormatId = new Map(
      allFormats.map((row) => [row.id, row.slug] as const),
    );

    const nikonLenses = await db
      .select({
        gearId: gear.id,
        slug: gear.slug,
        name: gear.name,
        lensSpecsGearId: lensSpecs.gearId,
        currentImageCircleSizeId: lensSpecs.imageCircleSizeId,
      })
      .from(gear)
      .leftJoin(lensSpecs, eq(lensSpecs.gearId, gear.id))
      .where(and(eq(gear.brandId, nikonBrand.id), eq(gear.gearType, "LENS")));

    const missingLensSpecs: Array<{ slug: string; name: string }> = [];
    const candidates: CandidateRow[] = [];
    let alreadyCorrect = 0;
    let wouldUpdateApsC = 0;
    let wouldUpdateFullFrame = 0;

    for (const row of nikonLenses) {
      if (!row.lensSpecsGearId) {
        missingLensSpecs.push({ slug: row.slug, name: row.name });
        continue;
      }

      const targetSlug = targetImageCircleSlugFromNikonLensName(row.name);
      const targetImageCircleSizeId = formatIdBySlug[targetSlug];
      const currentSlug = row.currentImageCircleSizeId
        ? (slugByFormatId.get(row.currentImageCircleSizeId) ?? null)
        : null;

      if (row.currentImageCircleSizeId === targetImageCircleSizeId) {
        alreadyCorrect += 1;
        continue;
      }

      if (targetSlug === "aps-c") {
        wouldUpdateApsC += 1;
      } else {
        wouldUpdateFullFrame += 1;
      }

      candidates.push({
        gearId: row.gearId,
        slug: row.slug,
        name: row.name,
        currentImageCircleSizeId: row.currentImageCircleSizeId,
        currentImageCircleSlug: currentSlug,
        targetSlug,
        targetImageCircleSizeId,
      });
    }

    console.log(
      `${LOG_PREFIX} Nikon brand: ${nikonBrand.name} (${nikonBrand.id})`,
    );
    console.log(
      `${LOG_PREFIX} Formats: aps-c=${apsC.id}, full-frame=${fullFrame.id}`,
    );
    console.log(`${LOG_PREFIX} Total Nikon lenses: ${nikonLenses.length}`);
    console.log(`${LOG_PREFIX} Already correct: ${alreadyCorrect}`);
    console.log(`${LOG_PREFIX} Missing lens_specs: ${missingLensSpecs.length}`);
    console.log(
      `${LOG_PREFIX} Would update → aps-c: ${wouldUpdateApsC}, full-frame: ${wouldUpdateFullFrame}, total: ${candidates.length}`,
    );

    if (missingLensSpecs.length > 0) {
      const missingSample = missingLensSpecs.slice(0, sample);
      console.log(`${LOG_PREFIX} Missing lens_specs sample:`);
      for (const row of missingSample) {
        console.log(`  ${row.slug} | ${row.name}`);
      }
    }

    if (candidates.length > 0) {
      const sampleRows = candidates.slice(0, sample);
      console.log(`${LOG_PREFIX} Sample updates:`);
      for (const row of sampleRows) {
        const currentLabel = row.currentImageCircleSlug ?? "null";
        console.log(
          `  ${row.slug} | ${row.name} | ${currentLabel} → ${row.targetSlug}`,
        );
      }
    }

    if (!apply) {
      console.log(
        `${LOG_PREFIX} Dry run complete. Re-run with --apply to persist changes.`,
      );
      return;
    }

    let updatedCount = 0;
    for (const candidate of candidates) {
      await db
        .update(lensSpecs)
        .set({
          imageCircleSizeId: candidate.targetImageCircleSizeId,
          updatedAt: new Date(),
        })
        .where(eq(lensSpecs.gearId, candidate.gearId));
      updatedCount += 1;
    }

    console.log(`${LOG_PREFIX} Updated rows: ${updatedCount}`);
    console.log(`${LOG_PREFIX} Backfill complete.`);
  } finally {
    await client.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error(`${LOG_PREFIX} Error:`, error);
  process.exit(1);
});
