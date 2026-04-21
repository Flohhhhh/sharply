import { NextResponse } from "next/server";
import { skipActiveBingoBoardByAdmin } from "~/server/bingo/service";

export async function POST() {
  try {
    const result = await skipActiveBingoBoardByAdmin();
    return NextResponse.json({ ok: true, result }, { status: 200 });
  } catch (error) {
    const status =
      typeof (error as { status?: unknown }).status === "number"
        ? Number((error as { status?: number }).status)
        : 500;
    const message =
      error instanceof Error ? error.message : "Failed to skip bingo board";
    return NextResponse.json({ error: message }, { status });
  }
}
