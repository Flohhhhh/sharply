import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const requestHeaders = await headers();
  const countryAlpha2Code =
    requestHeaders.get("x-vercel-ip-country") ??
    requestHeaders.get("x-geo-country") ??
    requestHeaders.get("x-edge-country") ??
    null;

  return NextResponse.json(
    {
      countryAlpha2: countryAlpha2Code,
    },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    },
  );
}
