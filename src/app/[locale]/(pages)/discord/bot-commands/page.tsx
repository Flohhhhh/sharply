import { Bot,MessageSquare } from "lucide-react";
import type { Metadata } from "next";
import DiscordBanner from "~/components/discord-banner";
import commandManifest from "~/data/discord-command-manifest.json";
import { buildLocalizedMetadata } from "~/lib/seo/metadata";
import type {
  DiscordCommandManifestEntry,
  DiscordCommandManifestOption,
} from "~/types/discord-command-manifest";

export const metadata: Metadata = buildLocalizedMetadata(
  "/discord/bot-commands",
  {
  title: "Discord Bot Commands",
  description:
    "Complete list of available Discord bot commands for the Sharply bot",
  openGraph: {
    title: "Discord Bot Commands",
    description:
      "Complete list of available Discord bot commands for the Sharply bot",
  },
  },
);

export default async function BotCommandsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const commands = commandManifest as DiscordCommandManifestEntry[];

  // Group commands by category
  const commandsByCategory = commands.reduce(
    (acc, cmd) => {
      const category = cmd.category ?? "Other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(cmd);
      return acc;
    },
    {} as Record<string, DiscordCommandManifestEntry[]>,
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
                const isContextMenu = cmd.commandType === "message";
                const commandName = cmd.name;
                const description = cmd.description;
                const options = cmd.options;

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
                            (opt: DiscordCommandManifestOption) => {
                              const isRequired = Boolean(opt.required);
                              return (
                                <span
                                  key={opt.name}
                                  className={`font-mono ${isRequired ? "text-destructive" : "text-muted-foreground"}`}
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
                      {/* Command Options (below description) */}
                      {options && options.length > 0 && (
                        <div className="space-y-2">
                          <ul className="space-y-1">
                          {options.map(
                              (opt: DiscordCommandManifestOption) => {
                                const isRequired = Boolean(opt.required);
                                return (
                                  <li key={opt.name} className="text-sm">
                                    <span
                                      className={`font-mono ${isRequired ? "text-destructive" : "text-muted-foreground"}`}
                                    >
                                      [{opt.name}]
                                    </span>
                                    {opt.description && (
                                      <span className="text-muted-foreground ml-2">
                                        — {opt.description}
                                      </span>
                                    )}
                                    {opt.options && opt.options.length > 0 && (
                                      <div className="text-muted-foreground mt-1 pl-5 text-xs">
                                        {opt.options.map((child) => (
                                          <div key={`${opt.name}-${child.name}`}>
                                            [{child.name}]
                                            {child.description
                                              ? ` — ${child.description}`
                                              : ""}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </li>
                                );
                              },
                            )}
                          </ul>
                        </div>
                      )}

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

      <DiscordBanner
        locale={locale}
        label="Need Help?"
        className="w-full max-w-5xl"
      />
    </div>
  );
}
