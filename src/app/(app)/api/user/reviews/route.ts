import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { getUserReviews } from "~/server/users/service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get("userId");
    // If a userId is provided, fetch reviews for that user (public profile view).
    // Otherwise, require auth and fetch the current user's reviews.
    const session = await auth();
    const targetUserId = requestedUserId || session?.user?.id || null;
    if (!targetUserId) {
      return NextResponse.json({ reviews: [] });
    }

    // Get user's reviews with gear information
    const userReviews = await getUserReviews(targetUserId);

    return NextResponse.json({ reviews: userReviews });
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
