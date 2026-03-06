import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { claimTileWithSubmission } from "~/server/bingo/service";

const claimSchema = z.object({
  boardTileId: z.string().min(1),
  discordMessageUrl: z.string().url().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = claimSchema.parse(body);
    const result = await claimTileWithSubmission(input);
    return NextResponse.json({ ok: true, result }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.errors },
        { status: 400 },
      );
    }

    const status =
      typeof (error as { status?: unknown }).status === "number"
        ? Number((error as { status?: number }).status)
        : 500;
    const message =
      error instanceof Error ? error.message : "Failed to claim bingo tile";
    return NextResponse.json({ error: message }, { status });
  }
}
