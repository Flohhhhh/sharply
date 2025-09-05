import "server-only";

import { and, ilike, eq, sql } from "drizzle-orm";
import { db } from "~/server/db";
import {
  gear,
  brands,
  cameraSpecs,
  lensSpecs,
  auditLogs,
} from "~/server/db/schema";
import { normalizeSearchName } from "~/lib/utils";

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
  gearType: "CAMERA" | "LENS";
  modelNumber?: string;
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
