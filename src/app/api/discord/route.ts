import { NextRequest, NextResponse } from "next/server";
import { verifyKey } from "discord-interactions";
import { commandHandlers } from "~/server/discord-bot";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-signature-ed25519");
  const timestamp = req.headers.get("x-signature-timestamp");
  const rawBody = await req.text();

  if (!signature || !timestamp) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const isValid = verifyKey(
    rawBody,
    signature,
    timestamp,
    process.env.DISCORD_BOT_PUBLIC_KEY!,
  );

  if (!isValid) {
    return new NextResponse("Invalid request signature", { status: 401 });
  }

  const interaction = JSON.parse(rawBody);

  // 1. handshake
  if (interaction.type === 1) {
    return NextResponse.json({ type: 1 });
  }

  // 2. Slash commands
  if (interaction.type === 2) {
    const commandName = interaction.data.name;
    const handler = commandHandlers[commandName];
    if (handler) return handler();

    return NextResponse.json({
      type: 4,
      data: { content: `❓ Unknown command: ${commandName}` },
    });
  }

  return new NextResponse("Unhandled interaction", { status: 400 });
}
