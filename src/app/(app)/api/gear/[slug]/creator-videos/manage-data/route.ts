import { NextResponse } from "next/server";
import { fetchManageGearCreatorVideos } from "~/server/creator-videos/service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const payload = await fetchManageGearCreatorVideos(slug);
    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    const message =
      error instanceof Error ? error.message : "Failed to load creator videos";
    return NextResponse.json({ error: message }, { status });
  }
}
