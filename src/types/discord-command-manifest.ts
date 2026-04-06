export type DiscordCommandManifestOption = {
  name: string;
  description?: string;
  required?: boolean;
  type: "string" | "subcommand";
  options?: DiscordCommandManifestOption[];
};

export type DiscordCommandManifestEntry = {
  name: string;
  commandType: "slash" | "message";
  category?: string;
  description?: string;
  examples?: string[];
  notes?: string;
  options?: DiscordCommandManifestOption[];
};
