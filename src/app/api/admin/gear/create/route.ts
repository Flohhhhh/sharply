import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { brands, gear } from "~/server/db/schema";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import { normalizeSearchName } from "~/lib/utils";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, brandId, gearType, modelNumber, force } = body as {
      name?: string;
      brandId?: string;
      gearType?: "CAMERA" | "LENS";
      modelNumber?: string;
      force?: boolean;
    };

    if (!name || !brandId || !gearType) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Validate brand exists
    const b = await db
      .select()
      .from(brands)
      .where(eq(brands.id, brandId))
      .limit(1);
    if (b.length === 0) {
      return NextResponse.json({ error: "Invalid brand" }, { status: 400 });
    }

    // Create slug from name
    const slug = name
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
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 409 },
      );
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
        return NextResponse.json(
          { error: "Model number already exists" },
          { status: 409 },
        );
      }
    }

    // Fuzzy warn: brand-scoped ilike tokens
    const normalized = normalizeSearchName(name, b[0]!.name);
    const tokens = normalized.split(" ").filter(Boolean);
    if (!force && tokens.length) {
      const orParts = tokens.map((t) => ilike(gear.searchName, `%${t}%`));
      const fuzzy = await db
        .select({ id: gear.id, name: gear.name, slug: gear.slug })
        .from(gear)
        .where(and(eq(gear.brandId, brandId), or(...orParts)))
        .limit(5);
      if (fuzzy.length > 0) {
        return NextResponse.json(
          { error: "Similar items exist", fuzzy },
          { status: 409 },
        );
      }
    }

    const created = await db
      .insert(gear)
      .values({
        name,
        slug,
        gearType,
        brandId,
        modelNumber: modelNumber || null,
        searchName: normalizeSearchName(name, b[0]!.name),
      })
      .returning({ id: gear.id, slug: gear.slug });

    return NextResponse.json(
      { success: true, gear: created[0] },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create gear:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
