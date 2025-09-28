import { NextResponse } from "next/server";
import { InteractionResponseFlags } from "discord-interactions";

export const pingCommand = {
  definition: {
    name: "ping",
    description: "Replies with pong",
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
