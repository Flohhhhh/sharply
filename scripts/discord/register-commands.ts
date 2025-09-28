import "dotenv/config";
import { commandDefinitions } from "~/server/discord-bot";

const { DISCORD_BOT_TOKEN, DISCORD_BOT_CLIENT_ID } = process.env;

async function registerCommands() {
  if (!DISCORD_BOT_TOKEN || !DISCORD_BOT_CLIENT_ID) {
    throw new Error(
      "Missing DISCORD_BOT_TOKEN or DISCORD_BOT_CLIENT_ID in .env",
    );
  }

  console.log(
    "🔄 Starting to register commands. Commands: ",
    JSON.stringify(commandDefinitions),
  );

  // Guild registration is instant, global takes ~1 hour
  const guildIds = process.env.DISCORD_GUILD_IDS?.split(",") ?? [];

  if (guildIds.length > 0) {
    for (const guildId of guildIds) {
      console.log(`🔄 Registering commands for guild ${guildId}`);
      const url = `https://discord.com/api/v10/applications/${DISCORD_BOT_CLIENT_ID}/guilds/${guildId}/commands`;
      await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        },
        body: JSON.stringify(commandDefinitions),
      });
      console.log(`✅ Commands registered for guild ${guildId}`);
    }
  } else {
    console.log("🔄 Registering commands globally");
    const url = `https://discord.com/api/v10/applications/${DISCORD_BOT_CLIENT_ID}/commands`;
    await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      },
      body: JSON.stringify(commandDefinitions),
    });
    console.log("✅ Commands registered globally");
  }
}

registerCommands();
