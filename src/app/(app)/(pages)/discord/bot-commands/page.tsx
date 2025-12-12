import type { Metadata } from "next";
import type {
  APIApplicationCommandOption,
  APIApplicationCommandSubcommandOption,
} from "discord-api-types/v10";
import { ApplicationCommandType } from "discord-api-types/v10";
import { commandMetadata } from "~/server/discord-bot";
import { Bot, MessageSquare } from "lucide-react";
import DiscordBanner from "~/components/discord-banner";

export const metadata: Metadata = {
  title: "Discord Bot Commands",
  description:
    "Complete list of available Discord bot commands for the Sharply bot",
  openGraph: {
    title: "Discord Bot Commands",
    description:
      "Complete list of available Discord bot commands for the Sharply bot",
  },
};

export default function BotCommandsPage() {
  // Group commands by category
  const commandsByCategory = commandMetadata.reduce(
    (acc, cmd) => {
      const category = cmd.category ?? "Other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(cmd);
      return acc;
    },
    {} as Record<string, typeof commandMetadata>,
  );

  // Sort categories
  const sortedCategories = Object.keys(commandsByCategory).sort();

  return (
    <div className="container mx-auto mt-16 max-w-5xl space-y-8 px-4 py-16">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Bot className="h-10 w-10" />
          <h1 className="text-4xl font-bold">Discord Bot Commands</h1>
        </div>
        <p className="text-muted-foreground max-w-xl">
          Complete reference for all available commands in the Sharply Discord
          bot. Use these commands in any Discord server where the Sharply bot is
          installed.
        </p>
      </div>

      <div className="space-y-8">
        {sortedCategories.map((category) => (
          <section key={category} className="space-y-4">
            <h2 className="text-2xl font-semibold">{category}</h2>
            <div className="grid gap-4">
              {commandsByCategory[category]?.map((cmd) => {
                const isContextMenu =
                  cmd.definition.type === ApplicationCommandType.Message;
                const commandName = cmd.definition.name;
                const description =
                  "description" in cmd.definition
                    ? cmd.definition.description
                    : undefined;
                const options =
                  "options" in cmd.definition
                    ? cmd.definition.options
                    : undefined;

                return (
                  <div
                    key={commandName}
                    className="flex flex-col gap-2 rounded-md border p-4"
                  >
                    <div className="bg-accent/40 flex items-center gap-2 rounded-md p-2 pl-4 text-xl">
                      {isContextMenu ? (
                        <MessageSquare className="h-5 w-5" />
                      ) : (
                        <span className="text-muted-foreground font-mono">
                          /
                        </span>
                      )}
                      <span className="font-mono">{commandName}</span>
                      {options && options.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 pl-2 text-base">
                          {options.map(
                            (
                              opt:
                                | APIApplicationCommandOption
                                | APIApplicationCommandSubcommandOption,
                            ) => {
                              const isRequired =
                                "required" in opt && Boolean(opt.required);
                              return (
                                <span
                                  key={opt.name}
                                  className={`font-mono ${isRequired ? "text-foreground" : "text-muted-foreground"}`}
                                >
                                  [{opt.name}]
                                </span>
                              );
                            },
                          )}
                        </div>
                      )}
                    </div>
                    {description && <p className="mt-2">{description}</p>}

                    <div className="mt-2 space-y-4">
                      {/* Examples */}
                      {cmd.examples && cmd.examples.length > 0 && (
                        <div className="space-y-2">
                          {/* <h4 className="text-sm font-semibold">Examples:</h4> */}
                          <ul className="space-y-1">
                            {cmd.examples.map((example, idx) => (
                              <li
                                key={idx}
                                className="text-muted-foreground font-mono text-sm"
                              >
                                {example}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Notes */}
                      {cmd.notes && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold">Notes:</h4>
                          <p className="text-muted-foreground text-sm">
                            {cmd.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <DiscordBanner label="Need Help?" className="w-full max-w-5xl" />
    </div>
  );
}
