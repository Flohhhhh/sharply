const DISCORD_MESSAGE_LINK_RE =
  /^https?:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/channels\/(\d{5,30})\/(\d{5,30})\/(\d{5,30})(?:\/)?(?:\?.*)?$/i;

export type ParsedDiscordMessageLink = {
  guildId: string;
  channelId: string;
  messageId: string;
};

export type CheckSubmissionValidityInput = {
  boardTileId?: string | null;
  discordMessageUrl?: string | null;
  boardIsActive?: boolean;
  tileCompletedAt?: Date | null;
};

export function parseDiscordMessageUrl(
  url: string,
): ParsedDiscordMessageLink | null {
  const trimmed = url.trim();
  const match = DISCORD_MESSAGE_LINK_RE.exec(trimmed);
  if (!match) return null;
  return {
    guildId: match[1]!,
    channelId: match[2]!,
    messageId: match[3]!,
  };
}

export function CheckSubmissionValidity(
  input: CheckSubmissionValidityInput,
): boolean {
  if (!input.boardTileId?.trim()) return false;
  if (!input.discordMessageUrl?.trim()) return false;
  if (input.boardIsActive === false) return false;
  if (input.tileCompletedAt) return false;
  return Boolean(parseDiscordMessageUrl(input.discordMessageUrl));
}
