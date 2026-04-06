import { NextResponse } from "next/server";

import { getDiscordBotInternalAuthError } from "~/lib/auth/discord-bot-internal";
import { getDiscordTrending } from "~/server/discord-bot-api/service";

const ALLOWED_WINDOWS = new Set(["7d", "30d"]);

export async function GET(request: Request) {
  const authError = getDiscordBotInternalAuthError(request);
  if (authError) {
    return NextResponse.json(
      { error: authError.message },
      { status: authError.status },
    );
  }

  const { searchParams } = new URL(request.url);
  const windowParam = searchParams.get("window") ?? "7d";
  if (!ALLOWED_WINDOWS.has(windowParam)) {
    return NextResponse.json(
      { error: "window must be 7d or 30d." },
      { status: 400 },
    );
  }

  return NextResponse.json({
    items: await getDiscordTrending(windowParam as "7d" | "30d", 10),
    window: windowParam,
  });
}
