import type { RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord-api-types/v10";

import { pingCommand } from "./commands/ping";
import { getGearCommand } from "./commands/gear";

const commands = { ping: pingCommand, gear: getGearCommand };

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
