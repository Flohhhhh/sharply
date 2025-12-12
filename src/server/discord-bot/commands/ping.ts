import { NextResponse } from "next/server";
import { InteractionResponseFlags } from "discord-interactions";

export const pingCommand = {
  definition: {
    name: "ping",
    description: "Replies with pong. Used to test if the bot is responsive.",
  },
  handler: () =>
    NextResponse.json({
      type: 4,
      data: {
        content: "🏓 Pong!",
        flags: InteractionResponseFlags.EPHEMERAL,
      },
    }),
};
