import { NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { brands, gear } from "~/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { normalizeSearchName } from "~/lib/utils";
import { performFuzzySearch } from "~/lib/utils/gear-creation";

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const brandId = searchParams.get("brandId") || "";
  const name = searchParams.get("name") || "";
  const modelNumber = searchParams.get("modelNumber") || "";

  if (!brandId || !name.trim()) {
    return NextResponse.json({ slugPreview: "", hard: {}, fuzzy: [] });
  }

  // Load brand name
  const b = await db
    .select()
    .from(brands)
    .where(eq(brands.id, brandId))
    .limit(1);
  if (b.length === 0) {
    return NextResponse.json({ slugPreview: "", hard: {}, fuzzy: [] });
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

  let modelHit: { id: string; name: string; slug: string }[] = [];
  if (modelNumber.trim()) {
    const lower = modelNumber.trim().toLowerCase();
    modelHit = await db
      .select({ id: gear.id, name: gear.name, slug: gear.slug })
      .from(gear)
      .where(eq(sql`lower(${gear.modelNumber})`, lower))
      .limit(1);
  }

  // Fuzzy search using centralized logic
  const { results: fuzzy, tokens: tokensForMatch } = await performFuzzySearch({
    inputName: name,
    brandName,
    brandId,
    db,
  });

  return NextResponse.json({
    slugPreview,
    hard: {
      slug: slugHit[0] || null,
      modelName: modelHit[0] || null,
    },
    fuzzy,
  });
}
