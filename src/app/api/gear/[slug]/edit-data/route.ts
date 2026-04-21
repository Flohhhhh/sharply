import { NextResponse } from "next/server";
import { fetchGearBySlug } from "~/server/gear/service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const gearItem = await fetchGearBySlug(slug);
    const payload = {
      ...gearItem,
      cameraSpecs: gearItem.cameraSpecs ?? null,
      lensSpecs: gearItem.lensSpecs ?? null,
    } satisfies Record<string, unknown>;
    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    const status = (error as { status?: number })?.status ?? 500;
    return NextResponse.json({ error: "Failed" }, { status });
  }
}
