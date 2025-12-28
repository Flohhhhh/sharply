import "server-only";
import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  sql,
  type SQL,
} from "drizzle-orm";
import { db } from "~/server/db";
import { brands, gear, mounts, gearMounts, lensSpecs } from "~/server/db/schema";
import {
  BRANDS as BRAND_CONSTANTS,
  MOUNTS as MOUNT_CONSTANTS,
} from "~/lib/constants";
import type { BrowseFilters } from "~/lib/browse/filters";
import type { GearCategorySlug } from "~/lib/browse/routing";
import type { GearType } from "~/types/gear";
import {
  LENS_FOCAL_LENGTH_SORT,
  lensFocalLengthSortExpression,
} from "./lens-sort";

const gearCategoryToTypes: Record<GearCategorySlug, GearType[]> = {
  cameras: ["CAMERA", "ANALOG_CAMERA"],
  lenses: ["LENS"],
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
      announcedDate: gear.announcedDate,
      createdAt: gear.createdAt,
      msrpNowUsdCents: gear.msrpNowUsdCents,
      mpbMaxPriceUsdCents: gear.mpbMaxPriceUsdCents,
    })
    .from(gear)
    .leftJoin(brands, eq(gear.brandId, brands.id))
    .where(where.length ? and(...where) : undefined)
    .orderBy(
      sql`coalesce(${gear.releaseDate}, ${gear.announcedDate}) DESC NULLS LAST`,
      desc(gear.createdAt),
    )
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
    where.push(inArray(gear.gearType, gearCategoryToTypes[input.category]));

  const f = input.filters;
  const needsLensFocalSort = f.sort === LENS_FOCAL_LENGTH_SORT;

  const selectFields: Record<string, any> = {
    id: gear.id,
    slug: gear.slug,
    name: gear.name,
    brandId: gear.brandId,
    gearType: gear.gearType,
    thumbnailUrl: gear.thumbnailUrl,
    releaseDate: gear.releaseDate,
    msrpNowUsdCents: gear.msrpNowUsdCents,
    mpbMaxPriceUsdCents: gear.mpbMaxPriceUsdCents,
  };

  if (needsLensFocalSort) {
    selectFields.lensFocalLengthMinMm = lensSpecs.focalLengthMinMm;
    selectFields.lensFocalLengthMaxMm = lensSpecs.focalLengthMaxMm;
  }

  let base = db.select(selectFields).from(gear);

  if (input.mountId) {
    base = base.leftJoin(gearMounts, sql`${gear.id} = ${gearMounts.gearId}`);
  }
  if (needsLensFocalSort) {
    base = base.leftJoin(lensSpecs, eq(gear.id, lensSpecs.gearId));
  }

  if (input.mountId) {
    where.push(eq(gearMounts.mountId, input.mountId));
  }

  // Traits filters
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
    // Default sort is resolved upstream; coerce invalid values to newest
    const allowed = [
      "newest",
      "price_asc",
      "price_desc",
      "rating",
      "popularity",
      "relevance",
      LENS_FOCAL_LENGTH_SORT,
    ] as const;
    type SortKey = (typeof allowed)[number];
    const sortKey: SortKey = allowed.includes(f.sort as SortKey)
      ? (f.sort as SortKey)
      : "newest";
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
      case LENS_FOCAL_LENGTH_SORT:
        return [lensFocalLengthSortExpression(), asc(gear.name)];
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

export async function getReleaseOrderedGearPage(params: {
  limit: number;
  brandId?: string;
  brandSlug?: string;
  offset?: number;
}) {
  const limit = Math.max(1, Math.min(params.limit ?? 12, 60));
  // No upper bound on offset - large offsets are expected for deep pagination
  const offset = Math.max(0, Math.floor(params.offset ?? 0));
  const where: SQL[] = [];
  if (params.brandId) where.push(eq(gear.brandId, params.brandId));
  else if (params.brandSlug) where.push(eq(brands.slug, params.brandSlug));

  const rows = await db
    .select({
      id: gear.id,
      slug: gear.slug,
      name: gear.name,
      brandName: brands.name,
      thumbnailUrl: gear.thumbnailUrl,
      gearType: gear.gearType,
      releaseDate: gear.releaseDate,
      msrpNowUsdCents: gear.msrpNowUsdCents,
      mpbMaxPriceUsdCents: gear.mpbMaxPriceUsdCents,
    })
    .from(gear)
    .leftJoin(brands, eq(gear.brandId, brands.id))
    .where(where.length ? and(...where) : undefined)
    .orderBy(sql`${gear.releaseDate} DESC NULLS LAST`, desc(gear.id))
    .limit(limit + 1)
    .offset(offset);

  const items = rows.slice(0, limit);
  const hasMore = rows.length > limit;

  return { items, hasMore };
}

// Deprecated: static params are now generated directly in the browse page
