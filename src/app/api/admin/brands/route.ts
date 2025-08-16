import { NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { brands } from "~/server/db/schema";

export async function GET() {
  const session = await auth();
  if (
    !session?.user ||
    !["ADMIN", "EDITOR"].includes((session.user as any).role)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = await db
    .select({ id: brands.id, name: brands.name })
    .from(brands);
  return NextResponse.json({ brands: rows });
}
