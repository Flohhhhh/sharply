import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  fetchApprovedReviews,
  fetchMyReviewStatus,
  submitReview,
} from "~/server/gear/service";
import { z } from "zod";
// No points; event_type enum values enforced in schema. Route delegates to server logic.

// Validation schema for review submission
const reviewSchema = z.object({
  content: z.string().min(1),
  genres: z.array(z.string()).min(1).max(3),
  recommend: z.boolean(),
  clientUserAgent: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    // validate first to return 400 quickly for invalid
    reviewSchema.parse(body);
    const res = await submitReview(slug, body);
    if (res.ok) {
      return NextResponse.json(
        { ok: true, review: res.review, moderation: { decision: "APPROVED" } },
        { status: 201 },
      );
    }

    switch (res.type) {
      case "ALREADY_REVIEWED":
        return NextResponse.json(
          { ok: false, type: "ALREADY_REVIEWED", message: res.message },
          { status: 409 },
        );
      case "MODERATION_BLOCKED":
        return NextResponse.json(
          {
            ok: false,
            type: "MODERATION_BLOCKED",
            code: res.code,
            message: res.message,
            retryAfterMs: res.retryAfterMs,
          },
          { status: res.code === "REVIEW_RATE_LIMITED" ? 429 : 400 },
        );
    }

    return NextResponse.json(
      { ok: false, type: "UNKNOWN", message: "Unexpected submission result." },
      { status: 500 },
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
    const { searchParams } = new URL(request.url);

    // If requesting current user's review existence, short-circuit
    const mine = searchParams.get("mine");
    if (mine) {
      const info = await fetchMyReviewStatus(slug);
      return NextResponse.json(info);
    }

    try {
      const gearReviews = await fetchApprovedReviews(slug);
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
