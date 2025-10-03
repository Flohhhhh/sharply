# Discord Bot

This document outlines the basics of Sharply's Discord bot system: directory structure, how slash commands are registered, how the API endpoint verifies and dispatches interactions, required environment variables, and how to add new commands.

## Structure

- `src/server/discord-bot/index.ts`
  - Central registry for commands
  - Exports:
    - `commandHandlers`: runtime dispatch map from command name → handler
    - `commandDefinitions`: JSON bodies used for registering slash commands
- `src/server/discord-bot/commands/*.ts`
  - Individual command modules export `{ definition, handler }`
  - Examples:
    - `commands/ping.ts` — simple health check
    - `commands/gear.ts` — `/gear [search]` returns the top gear match
- `src/app/(app)/api/discord/route.ts`
  - Public interaction endpoint that Discord calls (POST)
  - Verifies signatures and dispatches to the correct command handler
- `scripts/discord/register-commands.ts`
  - CLI script to register slash commands with Discord (guild or global)

## Environment Variables

Required for the interaction endpoint (Next.js runtime):

- `DISCORD_BOT_PUBLIC_KEY`: Discord public key used to verify interaction signatures

Required for the registration script:

- `DISCORD_BOT_TOKEN`: Bot token used to call Discord REST API
- `DISCORD_BOT_CLIENT_ID`: Application (bot) client ID
- `DISCORD_BOT_GUILD_IDS` (optional): Comma-separated guild IDs for instant registration; if omitted, commands are registered globally (may take up to ~1 hour to propagate)

Optional for link generation in responses:

- `NEXT_PUBLIC_BASE_URL`: Base URL for Sharply

## Registration Workflow

Slash commands must be registered with Discord before they appear in the client.

Script: `scripts/discord/register-commands.ts`

What it does:

1. Loads `commandDefinitions` from `src/server/discord-bot/index.ts`
2. If `DISCORD_BOT_GUILD_IDS` is provided, registers to each guild for instant updates
3. Otherwise registers globally (can take up to ~1 hour)

Run locally:

```bash
npx tsx scripts/discord/register-commands.ts
```

Notes:

- The script uses `dotenv/config` and reads from your `.env`
- Re-run after adding or changing commands

## Interaction Endpoint

File: `src/app/(app)/api/discord/route.ts`

Responsibilities:

1. Read raw body and headers `x-signature-ed25519` and `x-signature-timestamp`
2. Verify the request using `verifyKey` and `DISCORD_BOT_PUBLIC_KEY`
3. Handle `InteractionType.Ping` by returning `{ type: 1 }`
4. For `InteractionType.ApplicationCommand`:
   - Determine the command name
   - Dispatch to `commandHandlers[commandName]`
   - Respond with a JSON body of shape `{ type: 4, data: { content: string, flags? } }`

Important:

- Command handlers should return a Next.js `NextResponse` with the Discord interaction response body
- For ephemeral replies, set `flags: InteractionResponseFlags.EPHEMERAL`

## Adding a New Command

1. Create a new file under `src/server/discord-bot/commands/` (e.g., `hello.ts`):

```ts
import { NextResponse } from "next/server";
import { InteractionResponseFlags } from "discord-interactions";

export const helloCommand = {
  definition: {
    name: "hello",
    description: "Say hello",
  },
  handler: () =>
    NextResponse.json({
      type: 4,
      data: { content: "Hello!", flags: InteractionResponseFlags.EPHEMERAL },
    }),
};
```

2. Register it in `src/server/discord-bot/index.ts`:

```ts
import { helloCommand } from "./commands/hello";

const commands = { /* existing */, hello: helloCommand };
```

3. Run the registration script to push the updated definition(s):

```bash
npx tsx scripts/discord/register-commands.ts
```

## Example: /gear Command

- File: `src/server/discord-bot/commands/gear.ts`
- Accepts a required `search` string option
- Uses the shared search service to find the most relevant gear item
- Responds with the model name, brand, and a link constructed from `NEXT_PUBLIC_BASE_URL`

## Error Handling & Troubleshooting

- 401 Invalid request signature → Check `DISCORD_BOT_PUBLIC_KEY` value
- Commands not showing up → Ensure you ran the registration script; for global commands, wait up to ~1 hour
- 400 Bad request from registration → Check `DISCORD_BOT_TOKEN` and `DISCORD_BOT_CLIENT_ID`
- Local dev 500s → Ensure `NEXT_PUBLIC_BASE_URL` is set if you build links in responses

## Conventions

- Command files export a single object: `{ definition, handler }`
- Handlers should be small and rely on service/data layers; avoid DB access in command files directly
- Keep responses short and user-friendly; prefer ephemeral for noisy replies
