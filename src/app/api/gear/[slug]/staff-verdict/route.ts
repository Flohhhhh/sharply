import { type NextRequest, NextResponse } from "next/server";
import { fetchStaffVerdict } from "~/server/gear/service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const verdict = await fetchStaffVerdict(slug);
    return NextResponse.json({ verdict });
  } catch (e) {
    return NextResponse.json({ verdict: null }, { status: 200 });
  }
}
