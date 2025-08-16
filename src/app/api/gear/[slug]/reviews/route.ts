import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { reviews, gear, users } from "~/server/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

// Validation schema for review submission
const reviewSchema = z.object({
  content: z.string().min(1),
  genres: z.array(z.string()).min(1).max(3),
  recommend: z.boolean(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { slug } = await params;
    const body = await request.json();
    const validatedData = reviewSchema.parse(body);

    // Get gear item by slug
    const gearItem = await db
      .select({ id: gear.id })
      .from(gear)
      .where(eq(gear.slug, slug))
      .limit(1);

    if (!gearItem.length) {
      return NextResponse.json(
        { error: "Gear item not found" },
        { status: 404 },
      );
    }

    const gearId = gearItem[0]!.id;

    // Check if user already has a review for this gear
    const existingReview = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(
        and(
          eq(reviews.gearId, gearId),
          eq(reviews.createdById, session.user.id),
        ),
      )
      .limit(1);

    if (existingReview.length > 0) {
      return NextResponse.json(
        { error: "You have already reviewed this gear item" },
        { status: 409 },
      );
    }

    // Create new review
    const newReview = await db
      .insert(reviews)
      .values({
        gearId,
        createdById: session.user.id,
        content: validatedData.content,
        genres: validatedData.genres as any,
        recommend: validatedData.recommend,
      })
      .returning();

    return NextResponse.json(
      {
        message: "Review submitted successfully",
        review: newReview[0],
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating review:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    console.log("Fetching reviews for gear slug:", slug);
    const { searchParams } = new URL(request.url);

    // Get gear item by slug
    const gearItem = await db
      .select({ id: gear.id })
      .from(gear)
      .where(eq(gear.slug, slug))
      .limit(1);

    if (!gearItem.length) {
      console.log("Gear item not found for slug:", slug);
      return NextResponse.json(
        { error: "Gear item not found" },
        { status: 404 },
      );
    }

    const gearId = gearItem[0]!.id;
    console.log("Found gear ID:", gearId);

    // If requesting current user's review existence, short-circuit
    const mine = searchParams.get("mine");
    if (mine) {
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json({ hasReview: false });
      }
      const my = await db
        .select({ id: reviews.id, status: reviews.status })
        .from(reviews)
        .where(
          and(
            eq(reviews.gearId, gearId),
            eq(reviews.createdById, session.user.id),
          ),
        )
        .limit(1);
      return NextResponse.json({
        hasReview: my.length > 0,
        status: my[0]?.status ?? null,
      });
    }

    try {
      // Get approved reviews for this gear with user info and new metadata
      const gearReviews = await db
        .select({
          id: reviews.id,
          content: reviews.content,
          genres: reviews.genres,
          recommend: reviews.recommend,
          createdAt: reviews.createdAt,
          createdBy: {
            id: users.id,
            name: users.name,
            image: users.image,
          },
        })
        .from(reviews)
        .leftJoin(users, eq(reviews.createdById, users.id))
        .where(and(eq(reviews.gearId, gearId), eq(reviews.status, "APPROVED")))
        .orderBy(desc(reviews.createdAt));

      console.log("Successfully fetched reviews:", gearReviews.length);
      return NextResponse.json({ reviews: gearReviews });
    } catch (dbError) {
      console.error("Database error when fetching reviews:", dbError);
      return NextResponse.json(
        { error: "Database error when fetching reviews" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error in GET /api/gear/[slug]/reviews:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
