import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { brands } from "~/server/db/schema";

export async function GET() {
  const rows = await db
    .select({ id: brands.id, name: brands.name })
    .from(brands);
  return NextResponse.json({ brands: rows });
}
