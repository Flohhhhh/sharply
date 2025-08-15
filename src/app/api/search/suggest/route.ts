import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { gear, brands, mounts } from "~/server/db/schema";
import { ilike, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const normalizedQuery = query.toLowerCase().trim();
    const normalizedQueryNoPunct = normalizedQuery.replace(/[\s\-_.]+/g, "");

    // Use the same sophisticated search logic as the main search
    // Split query into parts for better matching
    const parts = normalizedQuery
      .split(/[\s_]+/) // Only split on spaces/underscores, not hyphens
      .filter((part) => part.length > 0)
      .map((part) => part.trim());

    // Only use strong tokens (letters + min length) for substring matching
    const strongParts = parts.filter((p) => /[a-z]/i.test(p) && p.length >= 3);

    // Column expressions (same as main search)
    const searchLower = sql`lower(${gear.searchName})`;
    const normalizedCol = sql`regexp_replace(${searchLower}, '[[:space:]_.-]+', '', 'g')`;
    const brandLower = sql`lower(${brands.name})`;
    const noBrand = sql`replace(${searchLower}, ${brandLower}, '')`;
    const normalizedNoBrand = sql`regexp_replace(${noBrand}, '[[:space:]_.-]+', '', 'g')`;

    // Build search conditions (same logic as main search)
    const conditions = [];

    // For queries with multiple strong parts, require at least 2 matches
    if (strongParts.length >= 2) {
      // Create a condition that requires at least 2 strong parts to match
      const partMatches = strongParts.map(
        (part) =>
          sql`CASE WHEN ${ilike(gear.searchName, `%${part}%`)} THEN 1 ELSE 0 END`,
      );
      const sumMatches = sql`(${sql.join(partMatches, sql` + `)})`;
      conditions.push(sql`${sumMatches} >= 2`);
    } else if (strongParts.length === 1) {
      // Single strong part - use it directly
      conditions.push(ilike(gear.searchName, `%${strongParts[0]}%`));
    }

    // Normalized contains checks
    conditions.push(
      sql`${normalizedCol} ILIKE ${`%${normalizedQueryNoPunct}%`}`,
    );
    conditions.push(
      sql`${normalizedNoBrand} ILIKE ${`%${normalizedQueryNoPunct}%`}`,
    );

    // Fuzzy fallbacks with higher thresholds
    conditions.push(
      sql`similarity(${normalizedNoBrand}, ${normalizedQueryNoPunct}) > 0.4`,
    );
    conditions.push(
      sql`similarity(${gear.searchName}, ${normalizedQueryNoPunct}) > 0.5`,
    );

    const whereClause = sql`(${sql.join(conditions, sql` OR `)})`;

    // Get gear suggestions with proper relevance scoring
    const relevanceExpr = sql<number>`GREATEST(
      -- Exact matches get highest priority
      CASE WHEN ${searchLower} ILIKE ${`%${query.toLowerCase().trim()}%`} THEN 2.0 ELSE 0 END,
      
      -- Normalized exact matches (handles punctuation differences)
      CASE WHEN ${normalizedCol} ILIKE ${`%${normalizedQueryNoPunct}%`} THEN 1.8 ELSE 0 END,
      
      -- Brand-agnostic normalized matches (lower priority)
      CASE WHEN ${normalizedNoBrand} ILIKE ${`%${normalizedQueryNoPunct}%`} THEN 1.0 ELSE 0 END,
      
      -- Fuzzy similarity with lower weights
      similarity(${normalizedNoBrand}, ${normalizedQueryNoPunct}) * 0.6,
      similarity(${normalizedCol}, ${normalizedQueryNoPunct}) * 0.4,
      similarity(${gear.searchName}, ${normalizedQueryNoPunct}) * 0.3
    )`;

    const gearResults = await db
      .select({
        id: gear.id,
        name: gear.name,
        slug: gear.slug,
        brandName: brands.name,
        mountValue: mounts.value,
        gearType: gear.gearType,
        relevance: relevanceExpr,
      })
      .from(gear)
      .leftJoin(brands, sql`${gear.brandId} = ${brands.id}`)
      .leftJoin(mounts, sql`${gear.mountId} = ${mounts.id}`)
      .where(whereClause)
      .orderBy(relevanceExpr)
      .limit(5);

    // Get brand suggestions
    const brandResults = await db
      .select({
        id: brands.id,
        name: brands.name,
        slug: brands.slug,
        relevance: sql<number>`similarity(${brands.name}, ${normalizedQuery})`,
      })
      .from(brands)
      .where(ilike(brands.name, `%${normalizedQuery}%`))
      .orderBy(sql`similarity(${brands.name}, ${normalizedQuery}) DESC`)
      .limit(3);

    // Combine and format suggestions
    const suggestions = [
      ...gearResults.map((item) => ({
        id: `gear:${item.id}`,
        label: `${item.name}${item.brandName ? ` (${item.brandName})` : ""}`,
        href: `/gear/${item.slug}`,
        type: "gear" as const,
        relevance: item.relevance,
      })),
      ...brandResults.map((item) => ({
        id: `brand:${item.id}`,
        label: `${item.name} (Brand)`,
        href: `/brand/${item.slug}`,
        type: "brand" as const,
        relevance: item.relevance,
      })),
    ]
      .sort((a, b) => (b.relevance ?? 0) - (a.relevance ?? 0))
      .slice(0, 8); // Limit total suggestions

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Suggest error:", error);
    return NextResponse.json({ suggestions: [] });
  }
}
