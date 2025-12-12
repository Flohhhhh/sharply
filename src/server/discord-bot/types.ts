import type { RESTPostAPIApplicationCommandsJSONBody } from "discord-api-types/v10";

/**
 * Extended metadata for documenting Discord bot commands.
 * These fields are used for the public documentation page but ignored by Discord API.
 */
export interface CommandMetadata {
  /** The command definition used for Discord registration */
  definition: RESTPostAPIApplicationCommandsJSONBody;
  /** Category for organizing commands in documentation */
  category?: string;
  /** Example usage strings to show users how to use the command */
  examples?: string[];
  /** Additional notes or details about the command */
  notes?: string;
}

/**
 * A Discord bot command with its definition, handler, and documentation metadata.
 */
export interface DiscordCommand {
  /** Command definition for Discord API registration */
  definition: RESTPostAPIApplicationCommandsJSONBody;
  /** Handler function that processes the command interaction */
  handler: (interaction: any) => Response | Promise<Response>;
  /** Optional metadata for documentation purposes */
  metadata?: Omit<CommandMetadata, "definition">;
}
