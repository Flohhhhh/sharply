"use server";
import "server-only";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  serviceCreateRecommendationChart,
  serviceUpdateChartMeta,
  serviceUpsertItem,
  serviceDeleteItem,
} from "./service";

function getFormString(fd: FormData, key: string): string {
  const value = fd.get(key);
  return typeof value === "string" ? value : "";
}

function getOptionalFormString(fd: FormData, key: string): string | undefined {
  const value = fd.get(key);
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

const createChartSchema = z.object({
  brand: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "lowercase letters, numbers, and dashes only"),
  title: z.string().trim().min(3).max(300),
  description: z.string().trim().max(800).optional(),
  isPublished: z.boolean().default(true),
});

export async function actionCreateRecommendationChart(formData: FormData) {
  const obj = {
    brand: getFormString(formData, "brand"),
    slug: getFormString(formData, "slug"),
    title: getFormString(formData, "title"),
    description: getOptionalFormString(formData, "description"),
    // Checkboxes submit "on" when checked; absent otherwise
    isPublished: Boolean(formData.get("isPublished")),
  };
  const parsed = createChartSchema.safeParse(obj);
  if (!parsed.success) {
    console.info("[recs] create:validation_error", parsed.error.flatten());
    return { ok: false as const, error: parsed.error.flatten() };
  }
  const result = await serviceCreateRecommendationChart(parsed.data);
  revalidatePath("/admin/recommended-lenses");
  revalidatePath("/recommended-lenses");
  revalidatePath(
    `/recommended-lenses/${parsed.data.brand}/${parsed.data.slug}`,
  );
  return { ok: true as const, chart: result };
}

// --- Chart Meta Update ---
const updateChartSchema = z.object({
  brand: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(200),
  title: z.string().trim().min(3).max(300),
  description: z.string().trim().max(800).optional(),
  isPublished: z.boolean().default(true),
});

export async function actionUpdateChartMeta(formData: FormData) {
  const obj = {
    brand: getFormString(formData, "brand"),
    slug: getFormString(formData, "slug"),
    title: getFormString(formData, "title"),
    description: getOptionalFormString(formData, "description"),
    isPublished: Boolean(formData.get("isPublished")),
  };
  const parsed = updateChartSchema.safeParse(obj);
  if (!parsed.success)
    return { ok: false as const, error: parsed.error.flatten() };
  const res = await serviceUpdateChartMeta(parsed.data);
  revalidatePath("/admin/recommended-lenses");
  revalidatePath(
    `/admin/recommended-lenses/${parsed.data.brand}/${parsed.data.slug}`,
  );
  revalidatePath(
    `/recommended-lenses/${parsed.data.brand}/${parsed.data.slug}`,
  );
  return { ok: true as const, chart: res };
}

// --- Items ---
const upsertItemSchema = z.object({
  brand: z.string().trim(),
  slug: z.string().trim(),
  gearId: z.string().trim().min(1),
  rating: z.enum(["best value", "best performance", "situational", "balanced"]),
  note: z.string().optional(),
  groupOverride: z.enum(["prime", "zoom"]).optional(),
  customColumn: z.string().optional(),
  priceMinOverride: z.coerce.number().int().positive().optional(),
  priceMaxOverride: z.coerce.number().int().positive().optional(),
});

export async function actionUpsertItem(formData: FormData) {
  try {
    const rawPriceMin = formData.get("priceMinOverride");
    const rawPriceMax = formData.get("priceMaxOverride");
    const priceMinOverride =
      typeof rawPriceMin === "string" && rawPriceMin.trim() !== ""
        ? rawPriceMin
        : undefined;
    const priceMaxOverride =
      typeof rawPriceMax === "string" && rawPriceMax.trim() !== ""
        ? rawPriceMax
        : undefined;

    const parsed = upsertItemSchema.safeParse({
      brand: getFormString(formData, "brand"),
      slug: getFormString(formData, "slug"),
      gearId: getFormString(formData, "gearId"),
      // Use logical-OR so empty string falls back to default
      rating: (getFormString(formData, "rating") || "balanced") as
        | "best value"
        | "best performance"
        | "situational"
        | "balanced",
      note: getOptionalFormString(formData, "note"),
      groupOverride: (formData.get("groupOverride") as any) || undefined,
      customColumn: getOptionalFormString(formData, "customColumn"),
      priceMinOverride,
      priceMaxOverride,
    });
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      return { ok: false as const, error: flat, message: "Validation failed" };
    }
    const res = await serviceUpsertItem(parsed.data as any);
    revalidatePath(
      `/admin/recommended-lenses/${parsed.data.brand}/${parsed.data.slug}`,
    );
    revalidatePath(
      `/recommended-lenses/${parsed.data.brand}/${parsed.data.slug}`,
    );
    return { ok: true as const, item: res };
  } catch (err: any) {
    console.error("[recs] upsertItem error", err);
    return {
      ok: false as const,
      message: err?.message || "Failed to upsert item",
    };
  }
}

export async function actionDeleteItem(formData: FormData) {
  const itemId = getFormString(formData, "itemId");
  if (!itemId) return { ok: false as const };
  const res = await serviceDeleteItem({ itemId });
  return { ok: !!res } as const;
}
