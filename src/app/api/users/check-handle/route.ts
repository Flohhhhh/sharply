import { type NextRequest, NextResponse } from "next/server";
import { checkHandleAvailability } from "~/server/users/service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const handle = searchParams.get("h");

  if (!handle) {
    return NextResponse.json(
      { available: false, reason: "Handle is required" },
      { status: 400 },
    );
  }

  const result = await checkHandleAvailability(handle);
  return NextResponse.json(result);
}

