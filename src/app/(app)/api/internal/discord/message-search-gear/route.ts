import { NextResponse } from "next/server";
import { z } from "zod";

import { getDiscordBotInternalAuthError } from "~/lib/auth/discord-bot-internal";
import { resolveDiscordMessageSearch } from "~/server/discord-bot-api/service";

const schema = z.object({
  message: z.string().trim().min(1),
});

export async function POST(request: Request) {
  const authError = getDiscordBotInternalAuthError(request);
  if (authError) {
    return NextResponse.json(
      { error: authError.message },
      { status: authError.status },
    );
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  return NextResponse.json(await resolveDiscordMessageSearch(parsed.data.message));
}
