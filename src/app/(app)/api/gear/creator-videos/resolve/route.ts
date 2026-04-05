import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveGearCreatorVideoInput } from "~/server/creator-videos/service";

const resolveSchema = z.object({
  creatorId: z.string().trim().min(1),
  url: z.string().trim().min(1),
});

export async function POST(request: Request) {
  try {
    const payload = resolveSchema.parse(await request.json());
    const resolution = await resolveGearCreatorVideoInput(payload);
    return NextResponse.json({ resolution }, { status: 200 });
  } catch (error) {
    const status = (error as { status?: number }).status ?? 400;
    const message =
      error instanceof Error ? error.message : "Failed to resolve video";
    return NextResponse.json({ error: message }, { status });
  }
}
