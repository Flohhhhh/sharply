import { NextResponse } from "next/server";
import { fetchAdminBrands } from "~/server/admin/brands/service";

export async function GET() {
  try {
    const rows = await fetchAdminBrands();
    return NextResponse.json({ brands: rows });
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    return NextResponse.json({ error: "Unauthorized" }, { status });
  }
}
