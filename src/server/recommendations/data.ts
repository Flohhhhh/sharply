// In Next.js runtime, enforce server-only import. In scripts (Node), skip.
if (process.env.NEXT_RUNTIME) {
  import("server-only").catch(() => {
    console.warn("[recommendations:data] server-only import failed, skipping.");
  });
}

import { db } from "~/server/db";
import {
  recommendationCharts,
  recommendationItems,
  gear,
  lensSpecs,
  type recommendationRatingEnum,
} from "~/server/db/schema";
import { and, eq, count } from "drizzle-orm";

export async function listRecommendationCharts() {
  const charts = await db
    .select({
      id: recommendationCharts.id,
      brand: recommendationCharts.brand,
      slug: recommendationCharts.slug,
      title: recommendationCharts.title,
      updatedDate: recommendationCharts.updatedDate,
    })
    .from(recommendationCharts)
    .where(eq(recommendationCharts.isPublished, true));
  if (charts.length === 0)
    return [] as {
      brand: string;
      slug: string;
      title: string;
      updatedDate: string;
    }[];
  // For now only return minimal fields; counts can be added later if needed
  return charts.map(({ id, ...rest }) => rest);
}

export async function listRecommendationChartParams() {
  return db
    .select({
      brand: recommendationCharts.brand,
      slug: recommendationCharts.slug,
    })
    .from(recommendationCharts)
    .where(eq(recommendationCharts.isPublished, true));
}

export async function fetchRecommendationChartByBrandSlug(
  brand: string,
  slug: string,
) {
  const chart = await db
    .select()
    .from(recommendationCharts)
    .where(
      and(
        eq(recommendationCharts.brand, brand),
        eq(recommendationCharts.slug, slug),
        eq(recommendationCharts.isPublished, true),
      ),
    )
    .limit(1);
  const [c] = chart;
  if (!c) return null;

  const items = await db
    .select({
      id: recommendationItems.id,
      rating: recommendationItems.rating,
      note: recommendationItems.note,
      groupOverride: recommendationItems.groupOverride,
      customColumn: recommendationItems.customColumn,
      priceMinOverride: recommendationItems.priceMinOverride,
      priceMaxOverride: recommendationItems.priceMaxOverride,
      gearId: recommendationItems.gearId,
      gearName: gear.name,
      gearSlug: gear.slug,
      gearThumb: gear.thumbnailUrl,
      gearMsrpCents: gear.msrpNowUsdCents,
      lensIsPrime: lensSpecs.isPrime,
      focalMin: lensSpecs.focalLengthMinMm,
      focalMax: lensSpecs.focalLengthMaxMm,
    })
    .from(recommendationItems)
    .innerJoin(gear, eq(gear.id, recommendationItems.gearId))
    .leftJoin(lensSpecs, eq(lensSpecs.gearId, recommendationItems.gearId))
    .where(eq(recommendationItems.chartId, c.id));

  // Debug logging: ensure slug and joins are present
  try {
    console.info("[recs:data] items fetched", {
      count: items.length,
      sample: items.slice(0, 3).map((i) => ({
        gearId: i.gearId,
        name: i.gearName,
        slug: (i as any).gearSlug,
        thumb: (i as any).gearThumb,
      })),
    });
  } catch {}

  return { chart: c, items };
}

// --- Writes ---

export type InsertChartParams = {
  brand: string;
  slug: string;
  title: string;
  description?: string | null;
  // YYYY-MM-DD
  updatedDate: string;
  isPublished: boolean;
};

export async function insertRecommendationChart(params: InsertChartParams) {
  const [row] = await db
    .insert(recommendationCharts)
    .values({
      brand: params.brand,
      slug: params.slug,
      title: params.title,
      description: params.description ?? null,
      // drizzle date (without TZ) expects string (YYYY-MM-DD)
      updatedDate: params.updatedDate,
      isPublished: params.isPublished,
    })
    .returning({
      id: recommendationCharts.id,
      brand: recommendationCharts.brand,
      slug: recommendationCharts.slug,
      title: recommendationCharts.title,
    });
  return row;
}

// Helpers
export async function getChartIdByBrandSlug(
  brand: string,
  slug: string,
): Promise<string | null> {
  const rows = await db
    .select({ id: recommendationCharts.id })
    .from(recommendationCharts)
    .where(
      and(
        eq(recommendationCharts.brand, brand),
        eq(recommendationCharts.slug, slug),
      ),
    )
    .limit(1);
  return rows[0]?.id ?? null;
}

export async function updateRecommendationChartMeta(params: {
  brand: string;
  slug: string;
  title: string;
  description?: string | null;
  isPublished: boolean;
  updatedDate?: string; // defaults to today if not provided
}) {
  const updatedDate =
    params.updatedDate ?? new Date().toISOString().slice(0, 10);
  const res = await db
    .update(recommendationCharts)
    .set({
      title: params.title,
      description: params.description ?? null,
      isPublished: params.isPublished,
      updatedDate,
    })
    .where(
      and(
        eq(recommendationCharts.brand, params.brand),
        eq(recommendationCharts.slug, params.slug),
      ),
    )
    .returning({
      id: recommendationCharts.id,
      brand: recommendationCharts.brand,
      slug: recommendationCharts.slug,
      title: recommendationCharts.title,
      description: recommendationCharts.description,
      updatedDate: recommendationCharts.updatedDate,
      isPublished: recommendationCharts.isPublished,
    });
  return res[0] ?? null;
}

export type UpsertItemParams = {
  chartId: string;
  gearId: string;
  rating: (typeof recommendationItems.rating.enumValues)[number];
  note?: string | null;
  groupOverride?:
    | (typeof recommendationItems.groupOverride.enumValues)[number]
    | null;
  customColumn?: string | null;
  priceMinOverride?: number | null;
  priceMaxOverride?: number | null;
};

export async function upsertRecommendationItem(params: UpsertItemParams) {
  // Check if exists
  const existing = await db
    .select({ id: recommendationItems.id })
    .from(recommendationItems)
    .where(
      and(
        eq(recommendationItems.chartId, params.chartId),
        eq(recommendationItems.gearId, params.gearId),
      ),
    )
    .limit(1);
  if (existing[0]) {
    const [row] = await db
      .update(recommendationItems)
      .set({
        rating: params.rating,
        note: params.note ?? null,
        groupOverride: params.groupOverride ?? null,
        customColumn: params.customColumn ?? null,
        priceMinOverride: params.priceMinOverride ?? null,
        priceMaxOverride: params.priceMaxOverride ?? null,
      })
      .where(eq(recommendationItems.id, existing[0].id))
      .returning({ id: recommendationItems.id });
    return row;
  }
  const [row] = await db
    .insert(recommendationItems)
    .values({
      chartId: params.chartId,
      gearId: params.gearId,
      rating: params.rating,
      note: params.note ?? null,
      groupOverride: params.groupOverride ?? null,
      customColumn: params.customColumn ?? null,
      priceMinOverride: params.priceMinOverride ?? null,
      priceMaxOverride: params.priceMaxOverride ?? null,
    })
    .returning({ id: recommendationItems.id });
  return row;
}

export async function deleteRecommendationItemById(itemId: string) {
  const [row] = await db
    .delete(recommendationItems)
    .where(eq(recommendationItems.id, itemId))
    .returning({ id: recommendationItems.id });
  return row;
}
