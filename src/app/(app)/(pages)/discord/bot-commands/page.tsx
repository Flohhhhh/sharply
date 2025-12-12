import type { Metadata } from "next";
import { commandMetadata } from "~/server/discord-bot";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Bot, Hash, MessageSquare } from "lucide-react";

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
    <div className="container mx-auto max-w-5xl space-y-8 px-4 py-16">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Bot className="h-10 w-10" />
          <h1 className="text-4xl font-bold">Discord Bot Commands</h1>
        </div>
        <p className="text-muted-foreground text-lg">
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
                const isContextMenu = cmd.definition.type === 3;
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
                  <Card key={commandName} className="overflow-hidden">
                    <CardHeader className="bg-muted/50 pb-3">
                      <CardTitle className="flex items-center gap-2 text-xl">
                        {isContextMenu ? (
                          <MessageSquare className="h-5 w-5" />
                        ) : (
                          <Hash className="h-5 w-5" />
                        )}
                        <span className="font-mono">{commandName}</span>
                        {cmd.category && (
                          <Badge variant="secondary" className="ml-auto">
                            {cmd.category}
                          </Badge>
                        )}
                      </CardTitle>
                      {description && (
                        <p className="text-muted-foreground mt-2">
                          {description}
                        </p>
                      )}
                    </CardHeader>

                    <CardContent className="space-y-4 pt-4">
                      {/* Command Options */}
                      {options && options.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold">Options:</h4>
                          <ul className="space-y-1 pl-4">
                            {options.map((opt: any, idx: number) => (
                              <li key={idx} className="text-sm">
                                <span className="text-muted-foreground font-mono">
                                  {opt.name}
                                </span>
                                {opt.required && (
                                  <Badge
                                    variant="destructive"
                                    className="ml-2 text-xs"
                                  >
                                    required
                                  </Badge>
                                )}
                                {opt.description && (
                                  <span className="text-muted-foreground ml-2">
                                    — {opt.description}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Examples */}
                      {cmd.examples && cmd.examples.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold">Examples:</h4>
                          <ul className="space-y-1 pl-4">
                            {cmd.examples.map((example, idx) => (
                              <li
                                key={idx}
                                className="bg-muted rounded p-2 font-mono text-sm"
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
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="border-muted-foreground/20 rounded-lg border p-6">
        <h3 className="mb-3 text-lg font-semibold">Need Help?</h3>
        <p className="text-muted-foreground text-sm">
          If you encounter any issues or have questions about these commands,
          please reach out in our Discord server or open an issue on GitHub.
        </p>
      </div>
    </div>
  );
}
