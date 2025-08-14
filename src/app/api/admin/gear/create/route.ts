import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import {
  brands,
  gear,
  cameraSpecs,
  lensSpecs,
  auditLogs,
} from "~/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { normalizeSearchName } from "~/lib/utils";
import {
  performFuzzySearch,
  shouldBlockFuzzyResults,
} from "~/lib/utils/gear-creation";

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

    // Ensure brand is prefixed in display name
    const brandName = b[0]!.name;
    const inputName = name.trim();
    const hasBrandPrefix = inputName
      .toLowerCase()
      .startsWith(brandName.toLowerCase());
    const displayName = hasBrandPrefix
      ? inputName
      : `${brandName} ${inputName}`;

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

    // Fuzzy search using centralized logic
    const {
      results: fuzzy,
      tokens: tokensForMatch,
      normalized,
    } = await performFuzzySearch({
      inputName: displayName,
      brandName,
      brandId,
      db,
    });

    // Check if fuzzy results should block creation
    const blockResult = shouldBlockFuzzyResults(fuzzy, force);
    if (blockResult) {
      console.log("[gear:create] fuzzy block", {
        input: displayName,
        brandId,
        normalized,
        tokensForMatch,
        results: fuzzy,
      });
      return NextResponse.json(blockResult, { status: 409 });
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

      // Audit: gear created
      await tx.insert(auditLogs).values({
        action: "GEAR_CREATE",
        actorUserId: session.user.id,
        gearId: createdGear.id,
      });

      return createdGear;
    });

    return NextResponse.json({ success: true, gear: created }, { status: 201 });
  } catch (error) {
    console.error("Failed to create gear:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
