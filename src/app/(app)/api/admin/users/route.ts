import { NextResponse } from "next/server";
import { fetchAllUsersForAdmin } from "~/server/admin/users/service";

export async function GET() {
  try {
    const users = await fetchAllUsersForAdmin();
    return NextResponse.json({ users });
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    return NextResponse.json({ error: "Unauthorized" }, { status });
  }
}
