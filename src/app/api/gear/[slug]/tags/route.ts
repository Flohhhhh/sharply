import { NextResponse } from "next/server";
import { fetchGearBySlug } from "~/server/gear/service";
import {
  fetchGearTagsForEditor,
  fetchTagsForEditor,
} from "~/server/tags/service";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const gear = await fetchGearBySlug(slug, {
    includeRumored: true,
    includeHidden: true,
  });
  const [tags, assignedTags] = await Promise.all([
    fetchTagsForEditor(),
    fetchGearTagsForEditor(gear.id),
  ]);
  return NextResponse.json({ tags, assignedTags });
}
