import type { RESTPostAPIApplicationCommandsJSONBody } from "discord-api-types/v10";

import { pingCommand } from "./commands/ping";
import { getGearCommand } from "./commands/gear";
import { leaderboardCommand } from "./commands/leaderboard";
import { compareCommand } from "./commands/compare";
import { totalsCommand } from "./commands/totals";
import { trendingCommand } from "./commands/trending";
import { messageSearchGearCommand } from "./commands/message-search-gear";

const commands = {
  ping: pingCommand,
  gear: getGearCommand,
  leaderboard: leaderboardCommand,
  compare: compareCommand,
  totals: totalsCommand,
  trending: trendingCommand,
  // message command (type 3) registered under the key 'message-search-gear'
  "message-search-gear": messageSearchGearCommand,
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
