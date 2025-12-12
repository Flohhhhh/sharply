import { NextResponse } from "next/server";
import { InteractionResponseFlags } from "discord-interactions";
import type {
  APIApplicationCommandInteraction,
  APIMessageApplicationCommandInteractionData,
} from "discord-api-types/v10";
import { resolveGearFromMessage } from "~/server/discord-bot/service";

/**
 * Message Command: "Search Gear"
 * Type: 3 (MESSAGE)
 *
 * When a user right-clicks a message → Apps → Search Gear,
 * we extract the message content, resolve it to a gear item,
 * and respond with an ephemeral link.
 */
export const messageSearchGearCommand = {
  definition: {
    name: "Search Gear",
    description:
      "Search for gear mentioned in a message. Right-click a message → Apps → Search Gear.",
    type: 3, // MESSAGE command
  },
  handler: async (interaction: APIApplicationCommandInteraction) => {
    try {
      const data = interaction.data as
        | APIMessageApplicationCommandInteractionData
        | undefined;
      const targetId = (data as any)?.target_id as string | undefined;
      const resolvedMessage = (data as any)?.resolved?.messages?.[
        targetId ?? ""
      ];
      const content: string | undefined = resolvedMessage?.content;

      // Basic context logging for observability
      console.log("[discord][message-search-gear] invoke", {
        guildId: (interaction as any)?.guild_id,
        channelId: (interaction as any)?.channel_id,
        userId:
          (interaction as any)?.member?.user?.id ??
          (interaction as any)?.user?.id,
        targetId,
        contentPreview: content ? content.slice(0, 140) : null,
      });

      if (!content || content.trim().length === 0) {
        return NextResponse.json({
          type: 4,
          data: {
            content: "Could not read message content.",
            flags: InteractionResponseFlags.EPHEMERAL,
          },
        });
      }

      const resolved = await resolveGearFromMessage(content, {
        maxQueries: 6,
      });

      if (!resolved.ok) {
        console.log("[discord][message-search-gear] resolve:miss", {
          code: resolved.code,
          tried: resolved.tried,
        });
        return NextResponse.json({
          type: 4,
          data: {
            content:
              resolved.code === "NO_CANDIDATES"
                ? "No gear-like text found in that message."
                : "No matching gear found.",
            flags: InteractionResponseFlags.EPHEMERAL,
          },
        });
      }

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "";
      const url = `${baseUrl}/gear/${resolved.item.slug}`;

      console.log("[discord][message-search-gear] resolve:hit", {
        item: {
          id: resolved.item.id,
          name: resolved.item.name,
          slug: resolved.item.slug,
          brand: resolved.item.brandName,
        },
        usedQuery: resolved.usedQuery,
        tried: resolved.tried,
      });

      return NextResponse.json({
        type: 4,
        data: {
          content: `Found: **${resolved.item.name}**${resolved.item.brandName ? ` (${resolved.item.brandName})` : ""}\n${url}`,
          flags: InteractionResponseFlags.EPHEMERAL,
        },
      });
    } catch (error) {
      console.error("[discord][message-search-gear] error", error);
      return NextResponse.json({
        type: 4,
        data: {
          content: "Sorry, there was an error searching for gear.",
          flags: InteractionResponseFlags.EPHEMERAL,
        },
      });
    }
  },
};
