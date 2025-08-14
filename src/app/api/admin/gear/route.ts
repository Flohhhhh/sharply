import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { brands, gear } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { normalizeSearchName } from "~/lib/utils";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, brandId, gearType } = body as {
      name?: string;
      brandId?: string;
      gearType?: "CAMERA" | "LENS";
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

    const created = await db
      .insert(gear)
      .values({
        name,
        slug,
        gearType,
        brandId,
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
