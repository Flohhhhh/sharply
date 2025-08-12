import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { reviews, gear, brands } from "~/server/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Get user's reviews with gear information
    const userReviews = await db
      .select({
        id: reviews.id,
        content: reviews.content,
        status: reviews.status,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
        gearId: gear.id,
        gearSlug: gear.slug,
        gearName: gear.name,
        gearType: gear.gearType,
        brandName: brands.name,
      })
      .from(reviews)
      .leftJoin(gear, eq(reviews.gearId, gear.id))
      .leftJoin(brands, eq(gear.brandId, brands.id))
      .where(eq(reviews.createdById, session.user.id))
      .orderBy(reviews.createdAt);

    return NextResponse.json({ reviews: userReviews });
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
