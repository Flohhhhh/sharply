import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { reviews, gear, users } from "~/server/db/schema";
import { and, desc, eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (
    !session?.user ||
    !["ADMIN", "EDITOR"].includes((session.user as any).role)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({
      id: reviews.id,
      status: reviews.status,
      content: reviews.content,
      genres: reviews.genres,
      recommend: reviews.recommend,
      createdAt: reviews.createdAt,
      userId: users.id,
      userName: users.name,
      gearId: gear.id,
      gearName: gear.name,
      gearSlug: gear.slug,
    })
    .from(reviews)
    .leftJoin(gear, eq(reviews.gearId, gear.id))
    .leftJoin(users, eq(reviews.createdById, users.id))
    .orderBy(desc(reviews.createdAt));

  return NextResponse.json({ reviews: rows });
}
