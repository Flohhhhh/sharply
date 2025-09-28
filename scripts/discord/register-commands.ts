import "dotenv/config";
import { commandDefinitions } from "~/server/discord-bot";

const { DISCORD_BOT_TOKEN, DISCORD_BOT_CLIENT_ID } = process.env;

async function logDiscordApiResponse(res: Response, context: string) {
  const contentType = res.headers.get("content-type") ?? "";
  let body: unknown;
  try {
    if (contentType.includes("application/json")) {
      body = await res.json();
    } else {
      body = await res.text();
    }
  } catch (error) {
    console.warn(`⚠️ Failed to parse response body for ${context}`, error);
  }
  console.log(`📦 Discord API response for ${context}`, {
    ok: res.ok,
    status: res.status,
    statusText: res.statusText,
    body,
  });
}

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
  const guildIds = process.env.DISCORD_BOT_GUILD_IDS?.split(",") ?? [];

  if (guildIds.length > 0) {
    for (const guildId of guildIds) {
      console.log(`🔄 Registering commands for guild ${guildId}`);
      const url = `https://discord.com/api/v10/applications/${DISCORD_BOT_CLIENT_ID}/guilds/${guildId}/commands`;
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        },
        body: JSON.stringify(commandDefinitions),
      });
      await logDiscordApiResponse(res, `guild ${guildId}`);
      if (res.ok) {
        console.log(`✅ Commands registered for guild ${guildId}`);
      } else {
        throw new Error(
          `Failed to register commands for guild ${guildId}: ${res.status} ${res.statusText}`,
        );
      }
    }
  } else {
    console.log("🔄 Registering commands globally");
    const url = `https://discord.com/api/v10/applications/${DISCORD_BOT_CLIENT_ID}/commands`;
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      },
      body: JSON.stringify(commandDefinitions),
    });
    await logDiscordApiResponse(res, "global");
    if (res.ok) {
      console.log("✅ Commands registered globally");
    } else {
      throw new Error(
        `Failed to register commands globally: ${res.status} ${res.statusText}`,
      );
    }
  }
}

registerCommands();
