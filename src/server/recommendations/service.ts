// In Next.js runtime, enforce server-only import. In scripts (Node), skip.
if (process.env.NEXT_RUNTIME) {
  import("server-only").catch(() => {
    console.warn(
      "[recommendations:service] server-only import failed, skipping.",
    );
  });
}

import {
  fetchRecommendationChartByBrandSlug,
  listRecommendationCharts,
  listRecommendationChartParams,
  insertRecommendationChart,
  type InsertChartParams,
  getChartIdByBrandSlug,
  upsertRecommendationItem,
  deleteRecommendationItemById,
  updateRecommendationChartMeta,
} from "./data";
import { mergeDefaultColumns } from "@/lib/recommendations/bucketing";
import { computeColumnKeyFromLensSpecs } from "@/lib/recommendations/bucketing";
import type { Rating } from "@/lib/recommendations/types";
import { requireUser, requireRole, type SessionRole } from "~/server/auth";

type ItemRow = NonNullable<
  Awaited<ReturnType<typeof fetchRecommendationChartByBrandSlug>>
>["items"][number];

function bucketFromSpecs(
  row: ItemRow,
): { group: "prime" | "zoom"; key: string } | null {
  const isPrime = row.lensIsPrime ?? false;
  const focalMin = row.focalMin ?? null;
  const focalMax = row.focalMax ?? null;
  if (isPrime) {
    const f = focalMin ?? focalMax;
    if (!f) return null;
    if (f <= 16) return { group: "prime", key: "prime-ultrawide" };
    if (f <= 24) return { group: "prime", key: "prime-24" };
    if (f <= 35) return { group: "prime", key: "prime-35" };
    if (f <= 50) return { group: "prime", key: "prime-50" };
    if (f <= 85) return { group: "prime", key: "prime-85" };
    if (f <= 200) return { group: "prime", key: "prime-short-telephoto" };
    if (f <= 450) return { group: "prime", key: "prime-telephoto" };
    if (f <= 650) return { group: "prime", key: "prime-600" };
    return { group: "prime", key: "prime-800" };
  }
  // Zooms
  if (focalMin == null || focalMax == null) return null;
  const range = focalMax - focalMin;
  const ratio = focalMax / Math.max(1, focalMin);
  if (focalMin < 16) return { group: "zoom", key: "zoom-ultrawide" };
  if (focalMin <= 30) return { group: "zoom", key: "zoom-wide" };
  if (focalMin <= 28 && focalMax >= 120 && ratio >= 4)
    return { group: "zoom", key: "zoom-superzoom" };
  if (focalMin <= 35 && focalMax <= 105)
    return { group: "zoom", key: "zoom-standard" };
  if (focalMin <= 100 && focalMax <= 250)
    return { group: "zoom", key: "zoom-telephoto" };
  return { group: "zoom", key: "zoom-supertelephoto" };
}

export async function serviceListCharts() {
  return listRecommendationCharts();
}

export async function serviceListChartParams() {
  return listRecommendationChartParams();
}

export async function serviceGetChart(brand: string, slug: string) {
  const data = await fetchRecommendationChartByBrandSlug(brand, slug);
  if (!data) return null;
  const { chart, items } = data;

  // try {
  //   console.info("[recs:service] fetched chart", {
  //     brand,
  //     slug,
  //     itemCount: items.length,
  //     sample: items.slice(0, 3).map((i) => ({
  //       id: i.gearId,
  //       name: i.gearName,
  //       slug:
  //         "gearSlug" in i && typeof i.gearSlug === "string"
  //           ? i.gearSlug
  //           : undefined,
  //     })),
  //   });
  // } catch {}

  // Gather custom columns from items
  const customCols = items
    .filter((i) => i.customColumn)
    .map((i) => ({
      key: i.customColumn!,
      label: i.customColumn!,
      group: (i.groupOverride ?? (i.lensIsPrime ? "prime" : "zoom")) as
        | "prime"
        | "zoom",
      order: 1000,
    }));

  const columns = mergeDefaultColumns(customCols);
  const map: Record<
    string,
    {
      name: string;
      slug?: string;
      rating: Rating;
      note?: string;
      priceDisplay?: string;
      priceLow?: number;
      thumbnailUrl?: string | null;
      focalDisplay?: string;
    }[]
  > = {};
  for (const col of [...columns.zoom, ...columns.prime]) map[col.key] = [];

  for (const row of items) {
    let targetKey: string | null = null;
    if (row.customColumn) {
      targetKey = row.customColumn;
    } else {
      const derived = computeColumnKeyFromLensSpecs({
        lensIsPrime: row.lensIsPrime ?? null,
        focalMin:
          typeof row.focalMin === "number"
            ? row.focalMin
            : (row.focalMin ?? null),
        focalMax:
          typeof row.focalMax === "number"
            ? row.focalMax
            : (row.focalMax ?? null),
      });
      if (derived) targetKey = derived.key;
    }
    if (!targetKey) continue;
    const list = map[targetKey];
    if (!list) continue;
    list.push({
      name: row.gearName ?? "",
      slug:
        "gearSlug" in row && typeof row.gearSlug === "string"
          ? row.gearSlug
          : undefined,
      rating: row.rating as Rating,
      note: row.note ?? undefined,
      priceDisplay:
        row.priceMinOverride != null && row.priceMaxOverride != null
          ? `$${row.priceMinOverride}-${row.priceMaxOverride}`
          : row.gearMsrpCents != null
            ? `$${Math.round((row.gearMsrpCents as number) / 100)}`
            : undefined,
      priceLow:
        row.priceMinOverride != null
          ? row.priceMinOverride
          : row.gearMsrpCents != null
            ? (row.gearMsrpCents as number) / 100
            : undefined,
      thumbnailUrl:
        "gearThumb" in row &&
        (typeof row.gearThumb === "string" || row.gearThumb == null)
          ? row.gearThumb
          : null,
      focalDisplay: row.lensIsPrime
        ? `${row.focalMin ?? row.focalMax}mm`
        : row.focalMin && row.focalMax
          ? `${row.focalMin}-${row.focalMax}mm`
          : undefined,
    });
  }
  Object.values(map).forEach((list) =>
    list.sort(
      (a, b) =>
        (a.priceLow ?? Number.MAX_SAFE_INTEGER) -
        (b.priceLow ?? Number.MAX_SAFE_INTEGER),
    ),
  );

  return {
    title: chart.title,
    updatedAt: chart.updatedDate as unknown as string,
    columns,
    itemsByColumn: map,
  };
}

// Raw view for admin editor (includes item ids)
export async function serviceGetChartAdminRaw(brand: string, slug: string) {
  const session = await requireUser();
  if (!requireRole(session, ["ADMIN", "EDITOR"] as SessionRole[])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  return fetchRecommendationChartByBrandSlug(brand, slug);
}

// --- Mutations ---
export async function serviceCreateRecommendationChart(
  params: Omit<InsertChartParams, "updatedDate">,
) {
  const session = await requireUser();
  if (!requireRole(session, ["ADMIN", "EDITOR"] as SessionRole[])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  // Basic extra guards
  const brand = params.brand.trim().toLowerCase();
  const slug = params.slug.trim().toLowerCase();
  const title = params.title.trim();
  if (!brand || !slug || !title) {
    throw new Error("brand, slug, title are required");
  }
  return insertRecommendationChart({
    brand,
    slug,
    title,
    description: params.description ?? null,
    updatedDate: new Date().toISOString().slice(0, 10),
    isPublished: params.isPublished,
  });
}

export async function serviceUpdateChartMeta(params: {
  brand: string;
  slug: string;
  title: string;
  description?: string | null;
  isPublished: boolean;
}) {
  const session = await requireUser();
  if (!requireRole(session, ["ADMIN", "EDITOR"] as SessionRole[])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  const brand = params.brand.trim().toLowerCase();
  const slug = params.slug.trim().toLowerCase();
  const title = params.title.trim();
  if (!brand || !slug || !title) throw new Error("brand, slug, title required");
  return updateRecommendationChartMeta({
    brand,
    slug,
    title,
    description: params.description ?? null,
    isPublished: params.isPublished,
  });
}

export async function serviceUpsertItem(params: {
  brand: string;
  slug: string;
  gearId: string;
  rating: Rating;
  note?: string | null;
  groupOverride?: "prime" | "zoom" | null;
  customColumn?: string | null;
  priceMinOverride?: number | null;
  priceMaxOverride?: number | null;
}) {
  const session = await requireUser();
  if (!requireRole(session, ["ADMIN", "EDITOR"] as SessionRole[])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  const chartId = await getChartIdByBrandSlug(
    params.brand.toLowerCase(),
    params.slug.toLowerCase(),
  );
  if (!chartId) throw new Error("Chart not found");
  return upsertRecommendationItem({
    chartId,
    gearId: params.gearId,
    rating: params.rating as any,
    note: params.note ?? null,
    groupOverride: (params.groupOverride as any) ?? null,
    customColumn: params.customColumn ?? null,
    priceMinOverride: params.priceMinOverride ?? null,
    priceMaxOverride: params.priceMaxOverride ?? null,
  });
}

export async function serviceDeleteItem(params: { itemId: string }) {
  const session = await requireUser();
  if (!requireRole(session, ["ADMIN", "EDITOR"] as SessionRole[])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  return deleteRecommendationItemById(params.itemId);
}
