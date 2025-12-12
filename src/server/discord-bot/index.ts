import type { RESTPostAPIApplicationCommandsJSONBody } from "discord-api-types/v10";
import type { DiscordCommand, CommandMetadata } from "./types";

import { pingCommand } from "./commands/ping";
import { getGearCommand } from "./commands/gear";
import { leaderboardCommand } from "./commands/leaderboard";
import { compareCommand } from "./commands/compare";
import { totalsCommand } from "./commands/totals";
import { trendingCommand } from "./commands/trending";
import { messageSearchGearCommand } from "./commands/message-search-gear";

const commands: Record<string, DiscordCommand> = {
  ping: {
    ...pingCommand,
    metadata: {
      category: "Utility",
      examples: ["/ping"],
      notes: "A simple command to test if the bot is responsive.",
    },
  },
  gear: {
    ...getGearCommand,
    metadata: {
      category: "Search",
      examples: [
        "/gear search query:Sony A7 IV",
        "/gear price query:Canon EOS R5",
      ],
      notes:
        "Search for camera gear or retrieve price information for specific items.",
    },
  },
  leaderboard: {
    ...leaderboardCommand,
    metadata: {
      category: "Community",
      examples: ["/leaderboard"],
      notes: "View the top contributors ranked by edits and reviews.",
    },
  },
  compare: {
    ...compareCommand,
    metadata: {
      category: "Search",
      examples: ["/compare one:Sony A7 IV two:Canon EOS R5"],
      notes: "Generate a comparison link for two gear items.",
    },
  },
  totals: {
    ...totalsCommand,
    metadata: {
      category: "Statistics",
      examples: ["/totals"],
      notes: "Display total gear items and contribution counts.",
    },
  },
  trending: {
    ...trendingCommand,
    metadata: {
      category: "Statistics",
      examples: ["/trending", "/trending window:30d"],
      notes: "See the most popular gear items from the last 7 or 30 days.",
    },
  },
  // message command (type 3) registered under the key 'message-search-gear'
  "message-search-gear": {
    ...messageSearchGearCommand,
    metadata: {
      category: "Context Menu",
      examples: ["Right-click a message → Apps → Search Gear"],
      notes:
        "Message context menu command that searches for gear mentioned in a message.",
    },
  },
};

// Runtime dispatcher
export const commandHandlers: Record<
  string,
  (interaction: any) => Response | Promise<Response>
> = Object.fromEntries(
  Object.values(commands).map((cmd) => [cmd.definition.name, cmd.handler]),
);

// Registration definitions
export const commandDefinitions: RESTPostAPIApplicationCommandsJSONBody[] =
  Object.values(commands).map((cmd) => cmd.definition);

// Documentation metadata for public display
export const commandMetadata: CommandMetadata[] = Object.values(commands).map(
  (cmd) => ({
    definition: cmd.definition,
    category: cmd.metadata?.category,
    examples: cmd.metadata?.examples,
    notes: cmd.metadata?.notes,
  }),
);
