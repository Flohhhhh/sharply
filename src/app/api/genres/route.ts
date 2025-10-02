import { NextResponse } from "next/server";
import { GENRES } from "~/lib/constants";

export async function GET() {
  return NextResponse.json({ genres: GENRES });
}
