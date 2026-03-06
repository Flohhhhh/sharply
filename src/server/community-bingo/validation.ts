import "server-only";

import { z } from "zod";
import type { CommunityBingoTileRow } from "./data";

const discordMessageUrlRegex =
  /^https?:\/\/(?:canary\.|ptb\.)?discord(?:app)?\.com\/channels\/(\d+)\/(\d+)\/(\d+)(?:\?.*)?$/i;

const submissionSchema = z.object({
  discordMessageUrl: z.string().url(),
  note: z.string().max(500).optional(),
});

export type SubmissionValidationInput = {
  tile: CommunityBingoTileRow | null;
  discordMessageUrl: string;
  note?: string;
};

export type SubmissionValidationResult = {
  isValid: boolean;
  reason?: string;
  parsedDiscordIds?: {
    guildId: string;
    channelId: string;
    messageId: string;
  };
};

export async function CheckSubmissionValidity(
  input: SubmissionValidationInput,
): Promise<SubmissionValidationResult> {
  const parsed = submissionSchema.safeParse({
    discordMessageUrl: input.discordMessageUrl,
    note: input.note,
  });

  if (!parsed.success) {
    return {
      isValid: false,
      reason: "Submission payload is malformed.",
    };
  }

  if (!input.tile) {
    return {
      isValid: false,
      reason: "Tile not found.",
    };
  }

  if (input.tile.completedAt) {
    return {
      isValid: false,
      reason: "Tile is already completed.",
    };
  }

  const match = input.discordMessageUrl.match(discordMessageUrlRegex);
  if (!match) {
    return {
      isValid: false,
      reason: "Discord message link format is invalid.",
    };
  }

  const [, guildId, channelId, messageId] = match;
  if (!guildId || !channelId || !messageId) {
    return {
      isValid: false,
      reason: "Discord message link is missing required IDs.",
    };
  }

  return {
    isValid: true,
    parsedDiscordIds: {
      guildId,
      channelId,
      messageId,
    },
  };
}
