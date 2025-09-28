import type { RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord-api-types/v10";

import { pingCommand } from "./commands/ping";

const commands = { ping: pingCommand };

// Runtime dispatcher
export const commandHandlers: Record<string, () => Response> =
  Object.fromEntries(
    Object.entries(commands).map(([name, cmd]) => [name, cmd.handler]),
  );

// Registration definitions
export const commandDefinitions: RESTPostAPIChatInputApplicationCommandsJSONBody[] =  
  Object.values(commands).map((cmd) => cmd.definition);
