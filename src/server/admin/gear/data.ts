import "server-only";

import { and, ilike, eq, sql, desc, count, ne, or, inArray } from "drizzle-orm";
import { db } from "~/server/db";
import {
  gear,
  brands,
  cameraSpecs,
  lensSpecs,
  auditLogs,
  gearMounts,
  mounts,
} from "~/server/db/schema";
import { normalizeSearchName } from "~/lib/utils";
import { normalizeFuzzyTokens } from "~/lib/utils/fuzzy";
import type { GearType } from "~/types/gear";
export interface FuzzySearchResult {
  id: string;
  name: string;
  slug: string;
}

export interface PerformFuzzySearchParams {
  inputName: string;
  brandName: string;
  brandId: string;
}

/**
 * Performs fuzzy search for similar gear items within the same brand.
 * Excludes brand tokens, splits letter-digit boundaries, and requires all tokens to match.
 */
export async function performFuzzySearch(
  params: PerformFuzzySearchParams,
): Promise<{
  results: FuzzySearchResult[];
  tokens: string[];
  normalized: string;
}> {
  const { inputName, brandName, brandId } = params;
  const normalized = normalizeSearchName(inputName, brandName);

  const sanitize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

  const brandTokenSet = new Set(
    sanitize(brandName).split(/\s+/).filter(Boolean),
  );

  const rawTokens = sanitize(inputName)
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => !brandTokenSet.has(t));

  const expanded: string[] = [];
  for (const token of rawTokens) {
    const parts = token.match(/[a-z]+|\d+/gi) || [];
    for (const part of parts) {
      if (part.length >= 2 || /\d+/.test(part)) expanded.push(part);
    }
  }

  const tokensForMatch = expanded.length > 0 ? expanded : rawTokens;
  if (tokensForMatch.length === 0) {
    return { results: [], tokens: [], normalized };
  }

  const andParts = tokensForMatch.map((t) => ilike(gear.searchName, `%${t}%`));

  const results = await db
    .select({ id: gear.id, name: gear.name, slug: gear.slug })
    .from(gear)
    .where(and(eq(gear.brandId, brandId), ...andParts))
    .limit(10);

  return { results, tokens: tokensForMatch, normalized };
}

export interface GearCreationCheckParams {
  brandId: string;
  name: string;
  modelNumber?: string;
}

export interface GearCreationCheckResult {
  slugPreview: string;
  hard: {
    slug: FuzzySearchResult | null;
    modelName: FuzzySearchResult | null;
  };
  fuzzy: FuzzySearchResult[];
}

export async function checkGearCreationData(
  params: GearCreationCheckParams,
): Promise<GearCreationCheckResult> {
  const { brandId, name, modelNumber } = params;

  if (!brandId || !name.trim()) {
    return {
      slugPreview: "",
      hard: { slug: null, modelName: null },
      fuzzy: [],
    };
  }

  // Load brand name
  const b = await db
    .select()
    .from(brands)
    .where(eq(brands.id, brandId))
    .limit(1);
  if (b.length === 0) {
    return {
      slugPreview: "",
      hard: { slug: null, modelName: null },
      fuzzy: [],
    };
  }
  const brandName = b[0]!.name;

  const slugPreview = buildSlug(brandName, name);
  const normalized = normalizeSearchName(name, brandName);

  // Hard conflicts
  const slugHit = await db
    .select({ id: gear.id, name: gear.name, slug: gear.slug })
    .from(gear)
    .where(eq(gear.slug, slugPreview))
    .limit(1);

  let modelHit: FuzzySearchResult[] = [];
  if (modelNumber?.trim()) {
    const lower = modelNumber.trim().toLowerCase();
    modelHit = await db
      .select({ id: gear.id, name: gear.name, slug: gear.slug })
      .from(gear)
      .where(eq(sql`lower(${gear.modelNumber})`, lower))
      .limit(1);
  }

  // Fuzzy search using centralized logic
  const { results: fuzzy } = await performFuzzySearch({
    inputName: name,
    brandName,
    brandId,
  });

  return {
    slugPreview,
    hard: {
      slug: slugHit[0] || null,
      modelName: modelHit[0] || null,
    },
    fuzzy,
  };
}

export interface GearCreationParams {
  name: string;
  brandId: string;
  gearType: GearType;
  modelNumber?: string;
  /**
   * Optional mounts to associate. Multi-mount is supported via the junction
   * table; mountId is deprecated in favor of mountIds.
   */
  mountIds?: string[];
  mountId?: string;
  linkManufacturer?: string;
  linkMpb?: string;
  linkAmazon?: string;
  force?: boolean;
}

export interface GearCreationResult {
  id: string;
  slug: string;
}

export async function createGearData(
  params: GearCreationParams,
): Promise<GearCreationResult> {
  const {
    name,
    brandId,
    gearType,
    modelNumber,
    mountIds,
    mountId,
    linkManufacturer,
    linkMpb,
    linkAmazon,
  } = params;

  // Validate brand exists
  const b = await db
    .select()
    .from(brands)
    .where(eq(brands.id, brandId))
    .limit(1);
  if (b.length === 0) {
    throw new Error("Invalid brand");
  }

  const requestedMountIds = mountIds ?? (mountId ? [mountId] : []);
  const normalizedMountIds = Array.from(
    new Set(
      requestedMountIds
        .map((m) => m.trim())
        .filter((m): m is string => m.length > 0),
    ),
  );

  if (normalizedMountIds.length > 0) {
    const found = await db
      .select({ id: mounts.id })
      .from(mounts)
      .where(inArray(mounts.id, normalizedMountIds));
    if (found.length !== normalizedMountIds.length) {
      throw new Error("Invalid mount");
    }
  }

  // Ensure brand is prefixed in display name
  const brandName = b[0]!.name;
  const inputName = name.trim();
  const hasBrandPrefix = inputName
    .toLowerCase()
    .startsWith(brandName.toLowerCase());
  const displayName = hasBrandPrefix ? inputName : `${brandName} ${inputName}`;

  // Create slug from display name (brand + name)
  const slug = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  // Hard duplicate by slug
  const slugExists = await db
    .select({ id: gear.id })
    .from(gear)
    .where(eq(gear.slug, slug))
    .limit(1);
  if (slugExists.length > 0) {
    throw new Error("Slug already exists");
  }

  // Hard duplicate by modelName (case-insensitive), if provided
  if (modelNumber) {
    const lower = modelNumber.toLowerCase();
    const hit = await db
      .select({ id: gear.id })
      .from(gear)
      .where(eq(sql`lower(${gear.modelNumber})`, lower))
      .limit(1);
    if (hit.length > 0) {
      throw new Error("Model number already exists");
    }
  }

  const created = await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(gear)
      .values({
        name: displayName,
        slug,
        gearType,
        brandId,
        modelNumber: modelNumber || null,
        linkManufacturer: linkManufacturer || null,
        linkMpb: linkMpb || null,
        linkAmazon: linkAmazon || null,
        searchName: normalizeSearchName(displayName, brandName),
      })
      .returning({ id: gear.id, slug: gear.slug });

    const createdGear = inserted[0]!;

    if (normalizedMountIds.length > 0) {
      await tx
        .insert(gearMounts)
        .values(
          normalizedMountIds.map((id) => ({
            gearId: createdGear.id,
            mountId: id,
          })),
        );
    }

    // Create an empty specs row matching the gear type
    if (gearType === "CAMERA") {
      await tx.insert(cameraSpecs).values({ gearId: createdGear.id });
    } else if (gearType === "LENS") {
      await tx.insert(lensSpecs).values({ gearId: createdGear.id });
    }

    return createdGear;
  });

  return created;
}

function buildSlug(brandName: string, name: string) {
  const sanitize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  const brandTokens = new Set(sanitize(brandName).split(/\s+/).filter(Boolean));
  const nameTokens = sanitize(name)
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => !brandTokens.has(t));
  const nameNoBrand = nameTokens.join(" ");
  return `${brandName} ${nameNoBrand}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export interface FetchAdminGearItemsParams {
  limit: number;
  offset: number;
  q?: string;
}

const adminGearSelect = {
  id: gear.id,
  name: gear.name,
  slug: gear.slug,
  gearType: gear.gearType,
  brandId: gear.brandId,
  brandName: brands.name,
  thumbnailUrl: gear.thumbnailUrl,
  createdAt: gear.createdAt,
};

export async function fetchAdminGearItemsData(
  params: FetchAdminGearItemsParams,
) {
  const { limit, offset, q } = params;

  // Build optional where filter using tokenized search across searchName and slug
  const trimmed = (q ?? "").trim();
  const tokens = trimmed ? normalizeFuzzyTokens(trimmed) : [];
  const whereFilter =
    tokens.length > 0
      ? and(
          ...tokens.map((t) =>
            or(ilike(gear.searchName, `%${t}%`), ilike(gear.slug, `%${t}%`)),
          ),
        )
      : undefined;

  const itemsQuery = db
    .select(adminGearSelect)
    .from(gear)
    .innerJoin(brands, eq(brands.id, gear.brandId));
  const countQuery = db
    .select({ count: count() })
    .from(gear)
    .innerJoin(brands, eq(brands.id, gear.brandId));

  const [items, totalResult] = await Promise.all([
    (whereFilter ? itemsQuery.where(whereFilter) : itemsQuery)
      .orderBy(desc(gear.createdAt))
      .limit(limit)
      .offset(offset),
    whereFilter ? countQuery.where(whereFilter) : countQuery,
  ]);

  return {
    items,
    totalCount: Number(totalResult[0]?.count ?? 0),
  };
}

export type FetchAdminGearItemsResult = Awaited<
  ReturnType<typeof fetchAdminGearItemsData>
>;

export type AdminGearTableRow = FetchAdminGearItemsResult["items"][number];

export interface RenameGearParams {
  gearId: string;
  newName: string;
}

export interface RenameGearResult {
  id: string;
  name: string;
  slug: string;
  searchName: string;
}

/**
 * Rename an existing gear item by id.
 * - Computes display name with brand prefix if missing
 * - Rebuilds slug (brand + name, kebab) and searchName (normalized)
 * - Validates slug uniqueness
 * - Updates in a single transaction and returns updated core fields
 */
export async function renameGearData(
  params: RenameGearParams,
): Promise<RenameGearResult> {
  const { gearId, newName } = params;

  const input = (newName ?? "").trim();
  if (!gearId || !input) {
    throw Object.assign(new Error("Invalid input"), { status: 400 });
  }

  return db.transaction(async (tx) => {
    // Load existing gear with brand for normalization
    const existing = await tx
      .select({ id: gear.id, brandId: gear.brandId })
      .from(gear)
      .where(eq(gear.id, gearId))
      .limit(1);
    if (existing.length === 0) {
      throw Object.assign(new Error("Gear not found"), { status: 404 });
    }

    const brandRow = await tx
      .select({ name: brands.name })
      .from(brands)
      .where(eq(brands.id, existing[0]!.brandId))
      .limit(1);
    if (brandRow.length === 0) {
      throw Object.assign(new Error("Brand not found for gear"), {
        status: 500,
      });
    }
    const brandName = brandRow[0]!.name;

    // Ensure display name is brand-prefixed
    const hasBrandPrefix = input
      .toLowerCase()
      .startsWith(brandName.toLowerCase());
    const displayName = hasBrandPrefix ? input : `${brandName} ${input}`;

    // Build slug from display name
    const nextSlug = displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    // Enforce slug uniqueness (exclude current row by id)
    const slugHit = await tx
      .select({ id: gear.id })
      .from(gear)
      .where(and(eq(gear.slug, nextSlug), ne(gear.id, gearId)))
      .limit(1);
    if (slugHit.length > 0) {
      throw Object.assign(new Error("Slug already exists"), { status: 409 });
    }

    // Compute normalized search name
    const search = normalizeSearchName(displayName, brandName);

    const updated = await tx
      .update(gear)
      .set({ name: displayName, slug: nextSlug, searchName: search })
      .where(eq(gear.id, gearId))
      .returning({
        id: gear.id,
        name: gear.name,
        slug: gear.slug,
        searchName: gear.searchName,
      });

    const row = updated[0]!;
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      searchName: row.searchName as unknown as string,
    };
  });
}

export interface UpdateGearThumbnailParams {
  gearId: string;
  thumbnailUrl: string | null;
}

export interface UpdateGearThumbnailResult {
  id: string;
  slug: string;
  thumbnailUrl: string | null;
}

/**
 * Update a gear item's thumbnail URL by id.
 */
export async function updateGearThumbnailData(
  params: UpdateGearThumbnailParams,
): Promise<UpdateGearThumbnailResult> {
  const { gearId, thumbnailUrl } = params;
  const updated = await db
    .update(gear)
    .set({ thumbnailUrl })
    .where(eq(gear.id, gearId))
    .returning({ id: gear.id, slug: gear.slug, thumbnailUrl: gear.thumbnailUrl });
  if (!updated[0]) {
    throw Object.assign(new Error("Gear not found"), { status: 404 });
  }
  return updated[0]!;
}
