import { NextResponse } from "next/server";
import { z } from "zod";

import { getDiscordBotInternalAuthError } from "~/lib/auth/discord-bot-internal";
import { resolveDiscordCompare } from "~/server/discord-bot-api/service";

const schema = z.object({
  firstQuery: z.string().trim().min(1),
  secondQuery: z.string().trim().min(1),
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

  const result = await resolveDiscordCompare(
    parsed.data.firstQuery,
    parsed.data.secondQuery,
  );

  return NextResponse.json(result);
}
