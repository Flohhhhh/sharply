import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { wishlists, popularityEvents, gear } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import { hasEventForUserOnUtcDay } from "~/lib/validation/dedupe";
// No points; event_type enum values enforced in schema

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      console.info("wishlist blocked", { reason: "unauthorized" });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const { action } = await request.json(); // "add" or "remove"

    // Get gear ID from slug
    const gearResult = await db
      .select({ id: gear.id })
      .from(gear)
      .where(eq(gear.slug, slug))
      .limit(1);

    if (!gearResult.length) {
      console.warn("wishlist blocked", { reason: "gear_not_found", slug });
      return NextResponse.json({ error: "Gear not found" }, { status: 404 });
    }

    const gearId = gearResult[0]!.id;
    const userId = session.user.id;

    if (action === "add") {
      // Check if already in wishlist
      const existing = await db
        .select()
        .from(wishlists)
        .where(and(eq(wishlists.userId, userId), eq(wishlists.gearId, gearId)))
        .limit(1);

      if (existing.length > 0) {
        console.info("wishlist blocked", {
          reason: "already_in_wishlist",
          slug,
          userId,
          gearId,
        });
        return NextResponse.json(
          { error: "Already in wishlist" },
          { status: 400 },
        );
      }

      // Add to wishlist
      await db.insert(wishlists).values({
        userId,
        gearId,
      });

      // Record popularity event (append-only) with same-day dedupe
      const alreadyToday = await hasEventForUserOnUtcDay({
        gearId,
        userId,
        eventType: "wishlist_add",
      });
      if (!alreadyToday) {
        await db.insert(popularityEvents).values({
          gearId,
          userId,
          eventType: "wishlist_add",
        });
      } else {
        console.info("popularity_event blocked", {
          reason: "same_day_dedupe",
          eventType: "wishlist_add",
          slug,
          userId,
          gearId,
        });
      }

      return NextResponse.json({ success: true, action: "added" });
    } else if (action === "remove") {
      // Remove from wishlist (append-only popularity events: do not delete past events)
      await db
        .delete(wishlists)
        .where(and(eq(wishlists.userId, userId), eq(wishlists.gearId, gearId)));

      return NextResponse.json({ success: true, action: "removed" });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Wishlist error:", error);
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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const userId = session.user.id;

    // Get gear ID from slug
    const gearResult = await db
      .select({ id: gear.id })
      .from(gear)
      .where(eq(gear.slug, slug))
      .limit(1);

    if (!gearResult.length) {
      return NextResponse.json({ error: "Gear not found" }, { status: 404 });
    }

    const gearId = gearResult[0]!.id;

    // Check if in wishlist
    const wishlistItem = await db
      .select()
      .from(wishlists)
      .where(and(eq(wishlists.userId, userId), eq(wishlists.gearId, gearId)))
      .limit(1);

    return NextResponse.json({
      inWishlist: wishlistItem.length > 0,
    });
  } catch (error) {
    console.error("Wishlist check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
