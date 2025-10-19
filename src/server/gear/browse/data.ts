import "server-only";
import { and, asc, desc, eq, ilike, sql, type SQL } from "drizzle-orm";
import { db } from "~/server/db";
import { brands, gear, mounts, gearMounts } from "~/server/db/schema";
import {
  BRANDS as BRAND_CONSTANTS,
  MOUNTS as MOUNT_CONSTANTS,
} from "~/lib/constants";
import type { BrowseFilters } from "~/lib/browse/filters";
import type { GearCategorySlug } from "~/lib/browse/routing";

const gearCategoryToType: Record<GearCategorySlug, "CAMERA" | "LENS"> = {
  cameras: "CAMERA",
  lenses: "LENS",
};

// Prefer using BRANDS directly from constants at call sites; kept for legacy imports
export async function getBrands() {
  return BRAND_CONSTANTS.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
  })).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getBrandBySlug(slug: string) {
  const target = BRAND_CONSTANTS.find(
    (b) => b.slug.toLowerCase() === slug.toLowerCase(),
  );
  return target
    ? { id: target.id, name: target.name, slug: target.slug }
    : null;
}

export function getCategories() {
  return ["cameras", "lenses"] as GearCategorySlug[];
}

export async function getMountByShortName(shortName: string, brandId?: string) {
  const lc = shortName.toLowerCase();
  const row = MOUNT_CONSTANTS.find((m) => {
    if (brandId && m.brand_id !== brandId) return false;
    const s = m.short_name?.toLowerCase();
    return s === lc;
  });
  return row
    ? {
        id: row.id,
        value: row.value,
        shortName: row.short_name,
        brandId: row.brand_id ?? null,
      }
    : null;
}

export async function getMountsForBrand(brandId: string) {
  return MOUNT_CONSTANTS.filter((m) => m.brand_id === brandId)
    .map((m) => ({ id: m.id, value: m.value, shortName: m.short_name }))
    .sort((a, b) => a.value.localeCompare(b.value));
}

export async function getLatestGear(
  limit = 3,
  opts?: { brandId?: string; brandSlug?: string },
) {
  const where: SQL[] = [];
  if (opts?.brandId) where.push(eq(gear.brandId, opts.brandId));
  if (!opts?.brandId && opts?.brandSlug)
    where.push(eq(brands.slug, opts.brandSlug));

  const rows = await db
    .select({
      id: gear.id,
      slug: gear.slug,
      name: gear.name,
      brandName: brands.name,
      thumbnailUrl: gear.thumbnailUrl,
      gearType: gear.gearType,
      releaseDate: gear.releaseDate,
      createdAt: gear.createdAt,
      msrpNowUsdCents: gear.msrpNowUsdCents,
    })
    .from(gear)
    .leftJoin(brands, eq(gear.brandId, brands.id))
    .where(where.length ? and(...where) : undefined)
    .orderBy(sql`${gear.releaseDate} DESC NULLS LAST`, desc(gear.createdAt))
    .limit(limit);
  return rows;
}

export type SearchInput = {
  brandId?: string;
  category?: GearCategorySlug;
  mountId?: string;
  filters: BrowseFilters;
};

export async function searchGear(input: SearchInput) {
  const where: SQL[] = [];
  if (input.brandId) where.push(eq(gear.brandId, input.brandId));
  if (input.category)
    where.push(eq(gear.gearType, gearCategoryToType[input.category]));

  // Select base; include join only when a mount filter is present
  const base = input.mountId
    ? db
        .select({
          id: gear.id,
          slug: gear.slug,
          name: gear.name,
          brandId: gear.brandId,
          gearType: gear.gearType,
          thumbnailUrl: gear.thumbnailUrl,
          releaseDate: gear.releaseDate,
          msrpNowUsdCents: gear.msrpNowUsdCents,
        })
        .from(gear)
        .leftJoin(gearMounts, sql`${gear.id} = ${gearMounts.gearId}`)
    : db
        .select({
          id: gear.id,
          slug: gear.slug,
          name: gear.name,
          brandId: gear.brandId,
          gearType: gear.gearType,
          thumbnailUrl: gear.thumbnailUrl,
          releaseDate: gear.releaseDate,
          msrpNowUsdCents: gear.msrpNowUsdCents,
        })
        .from(gear);

  if (input.mountId) {
    where.push(eq(gearMounts.mountId, input.mountId));
  }

  // Traits filters
  const f = input.filters;
  if (f.minPrice != null)
    where.push(sql`${gear.msrpNowUsdCents} >= ${f.minPrice * 100}`);
  if (f.maxPrice != null)
    where.push(sql`${gear.msrpNowUsdCents} <= ${f.maxPrice * 100}`);
  if (f.minYear != null)
    where.push(sql`extract(year from ${gear.releaseDate}) >= ${f.minYear}`);
  if (f.maxYear != null)
    where.push(sql`extract(year from ${gear.releaseDate}) <= ${f.maxYear}`);

  // Sorting
  const orderBy = (() => {
    // Default to newest for browse pages, coerce invalid values to newest
    const allowed = new Set([
      "newest",
      "price_asc",
      "price_desc",
      "rating",
      "popularity",
    ]);
    const sortKey = allowed.has(f.sort as any)
      ? (f.sort as any)
      : ("newest" as const);
    switch (sortKey) {
      case "newest":
        return [sql`${gear.releaseDate} DESC NULLS LAST`, asc(gear.name)];
      case "price_asc":
        return [asc(gear.msrpNowUsdCents), asc(gear.name)];
      case "price_desc":
        return [sql`${gear.msrpNowUsdCents} DESC NULLS LAST`, asc(gear.name)];
      case "popularity":
        return [desc(gear.createdAt), asc(gear.name)];
      case "relevance":
        return [asc(gear.name)];
      default:
        return [sql`${gear.releaseDate} DESC NULLS LAST`, asc(gear.name)];
    }
  })();

  const pageSize = input.filters.perPage;
  const offset = (input.filters.page - 1) * pageSize;

  const rows = await base
    .where(where.length ? and(...where) : undefined)
    .orderBy(...orderBy)
    .limit(pageSize)
    .offset(offset);

  // Total count (replicate join when filtering by mount)
  const countQuery = input.mountId
    ? db
        .select({ count: sql<number>`count(*)` })
        .from(gear)
        .leftJoin(gearMounts, sql`${gear.id} = ${gearMounts.gearId}`)
    : db.select({ count: sql<number>`count(*)` }).from(gear);

  const countRows = await countQuery.where(
    where.length ? and(...where) : undefined,
  );

  return { items: rows, total: Number(countRows[0]?.count ?? 0) };
}

// Deprecated: static params are now generated directly in the browse page
