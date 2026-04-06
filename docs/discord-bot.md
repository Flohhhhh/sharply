# Discord Bot

Sharply no longer receives Discord interactions directly. The persistent `sharply-bot` repo owns command registration and Discord gateway handling, while this app exposes authenticated internal endpoints that the bot calls for structured data and app-owned logic.

See also: `docs/frontend-bot-contract.md` for the cross-repo ownership rules and change workflow.

## Structure

- `src/app/(app)/api/internal/discord/**`
  - Internal endpoints consumed by the bot runtime
  - Protected by a shared bearer token
- `src/server/discord-bot-api/service.ts`
  - Bot-facing orchestration layer for search, compare, totals, leaderboard, trending, and message-to-gear resolution
- `src/server/discord-bot-api/data.ts`
  - Raw DB reads that the bot contract needs but which are not otherwise exposed cleanly yet
- `src/data/discord-command-manifest.json`
  - Synced command manifest used by `/discord/bot-commands`

## Environment Variables

- `DISCORD_BOT_INTERNAL_API_TOKEN`
  - Shared bearer token used by `sharply-bot` when calling internal bot endpoints
- `NEXT_PUBLIC_BASE_URL`
  - Used to build canonical Sharply links returned to the bot

## Error Handling & Troubleshooting

- 401 Missing or invalid bearer token → Check that `sharply-bot` and Sharply share the same `DISCORD_BOT_INTERNAL_API_TOKEN`
- 503 Token not configured → Set `DISCORD_BOT_INTERNAL_API_TOKEN` in the Sharply environment
- Bot command failures after app deployment → Verify `NEXT_PUBLIC_BASE_URL` is still set so returned links are absolute

## Conventions

- Keep Discord formatting and command registration in `sharply-bot`
- Keep Sharply as the data truth and internal API surface
- Update the synced command manifest when command docs change in the bot repo
