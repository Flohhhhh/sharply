import { NextResponse } from "next/server";
import { fetchTagAssignedGearForEditor } from "~/server/tags/service";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return NextResponse.json({ gear: await fetchTagAssignedGearForEditor(id) });
}
