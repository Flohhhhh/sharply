import { type NextRequest, NextResponse } from "next/server";
import { checkGearCreationAdmin } from "~/server/admin/gear/service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId") || "";
    const name = searchParams.get("name") || "";
    const modelNumber = searchParams.get("modelNumber") || "";

    const result = await checkGearCreationAdmin({
      brandId,
      name,
      modelNumber: modelNumber || undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to check gear creation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
