import { NextResponse } from "next/server";
import { fetchGearEditorRelationships } from "~/server/gear/service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const relationships = await fetchGearEditorRelationships(slug);
    return NextResponse.json(relationships);
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    return NextResponse.json(
      {
        error: status === 401 ? "Unauthorized" : "Failed to load relationships",
      },
      { status },
    );
  }
}
