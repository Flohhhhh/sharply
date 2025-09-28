import type { RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord-api-types/v10";

import { pingCommand } from "./commands/ping";
import { getGearCommand } from "./commands/gear";
import { leaderboardCommand } from "./commands/leaderboard";
import { compareCommand } from "./commands/compare";
import { totalsCommand } from "./commands/totals";
import { trendingCommand } from "./commands/trending";

const commands = {
  ping: pingCommand,
  gear: getGearCommand,
  leaderboard: leaderboardCommand,
  compare: compareCommand,
  totals: totalsCommand,
  trending: trendingCommand,
};

// Runtime dispatcher
export const commandHandlers: Record<
  string,
  (interaction: any) => Response | Promise<Response>
> = Object.fromEntries(
  Object.entries(commands).map(([name, cmd]) => [name, cmd.handler]),
);

// Registration definitions
export const commandDefinitions: RESTPostAPIChatInputApplicationCommandsJSONBody[] =
  Object.values(commands).map((cmd) => cmd.definition);
