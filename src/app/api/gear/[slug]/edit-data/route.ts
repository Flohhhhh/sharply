import { NextResponse } from "next/server";
import { fetchGearBySlug } from "~/server/gear/service";

export async function GET(_req: Request, { params }: { params: any }) {
  try {
    const gearItem = await fetchGearBySlug(params.slug);
    const payload = {
      ...gearItem,
      cameraSpecs: gearItem.cameraSpecs ?? null,
      lensSpecs: gearItem.lensSpecs ?? null,
    } as any;
    return NextResponse.json(payload, { status: 200 });
  } catch (e) {
    const status = (e as any)?.status ?? 500;
    return NextResponse.json({ error: "Failed" }, { status });
  }
}
