import { NextResponse } from "next/server";

import { getDiscordBotInternalAuthError } from "~/lib/auth/discord-bot-internal";
import { getDiscordLeaderboard } from "~/server/discord-bot-api/service";

export async function GET(request: Request) {
  const authError = getDiscordBotInternalAuthError(request);
  if (authError) {
    return NextResponse.json(
      { error: authError.message },
      { status: authError.status },
    );
  }

  return NextResponse.json({
    rows: await getDiscordLeaderboard(10),
  });
}
