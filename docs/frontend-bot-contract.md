# Frontend/Bot Contract

This document defines the working relationship between:

- `sharply`
  - The Next.js app, data model, and internal API
- `sharply-bot`
  - The persistent Discord bot runtime and command surface

This file is intentionally mirrored in both repos. When the contract changes, update both copies in the same work session.

## Purpose

The goal is to keep ownership clear:

- Sharply owns product data, business rules, app-side services, and internal API responses.
- Sharply Bot owns Discord interactions, command registration, message formatting, and gateway/runtime concerns.

Neither repo should quietly absorb the other repo's responsibilities.

## Source Of Truth

Use these ownership rules:

- Discord command execution lives in `sharply-bot`.
- Discord command registration lives in `sharply-bot`.
- App/business logic lives in `sharply`.
- Database access lives in `sharply`.
- Public bot command documentation shown on the Sharply site is rendered from a mirrored command manifest in `sharply`.

If a feature needs both repos, the default split is:

- `sharply`: provide structured data or mutations through an internal endpoint.
- `sharply-bot`: call that endpoint, handle Discord UX, and format the reply.

## Interaction Model

The normal flow is:

1. A user runs a slash command or message context command in Discord.
2. `sharply-bot` receives the interaction over the Discord gateway.
3. `sharply-bot` validates command input and decides whether to reply immediately or defer.
4. `sharply-bot` calls a protected internal endpoint in `sharply`.
5. `sharply` returns structured JSON only.
6. `sharply-bot` formats that result for Discord and sends the final response.

Important consequences:

- `sharply` does not receive Discord webhook interactions directly.
- `sharply-bot` does not import `sharply` server modules directly.
- Network calls between the repos are the integration boundary.

## Alignment Rules

Keep the two repos aligned with these rules:

- If a command is added, removed, or renamed, update:
  - the command implementation in `sharply-bot`
  - command deployment in `sharply-bot`
  - the mirrored manifest in `sharply`
  - any relevant docs in both repos
- If a command needs new data, add or extend an internal endpoint in `sharply` first, then consume it in `sharply-bot`.
- If an internal endpoint response shape changes, update the bot client types in the same change set.
- If a field is app-derived rather than Discord-derived, compute it in `sharply`.
- If a field is presentation-only for Discord, compute it in `sharply-bot`.

## Clean Boundaries

### `sharply` should do

- Query the database
- Apply product/business logic
- Build canonical Sharply URLs
- Enforce auth for internal bot endpoints
- Return stable, explicit JSON shapes

### `sharply-bot` should do

- Define command builders
- Deploy commands to Discord
- Handle `deferReply`, `editReply`, and ephemeral/public reply behavior
- Format text for Discord
- Handle Discord-specific errors and user-facing fallback copy

### `sharply` should not do

- Register Discord commands
- Own Discord ingress
- Return `discord.js`-specific objects
- Depend on gateway runtime state

### `sharply-bot` should not do

- Read the Sharply database directly
- Reimplement search, compare, pricing, leaderboard, or trending logic locally
- Import Next.js app internals from `sharply`
- Become the source of truth for command data that the app site displays unless the mirrored manifest is updated too

## Internal API Rules

The internal API between the repos must stay boring and explicit:

- Use authenticated HTTP endpoints only.
- Every bot-facing endpoint must require the shared bearer token.
- Prefer narrow endpoints for command use cases over leaking broad app internals.
- Return plain JSON with stable field names.
- Keep Discord formatting out of the API layer.
- Use absolute Sharply URLs when returning links for Discord.

When extending the contract:

- Prefer additive response changes over breaking changes.
- Avoid endpoint shapes that require the bot to understand app internals.
- Keep one endpoint responsible for one command use case unless there is a strong reason to unify them.

## Documentation Sync

The Sharply site has a public bot commands page. That means docs must stay aligned:

- `sharply-bot` owns the real command definitions.
- `sharply` owns the mirrored manifest used for the site page.
- Any command metadata change must update the mirrored manifest.

The mirrored manifest exists because the site should not import live bot runtime code across repos.

## Change Workflow

For command-related work, use this sequence:

1. Decide whether the change is app logic, Discord UX, or both.
2. If app logic is needed, add or update the internal endpoint in `sharply`.
3. Update the bot client in `sharply-bot`.
4. Update or add the command implementation in `sharply-bot`.
5. Update the mirrored command manifest in `sharply` if command docs changed.
6. Update integration docs if the boundary or rules changed.
7. Run verification in both repos.

## Verification Checklist

For changes that touch the contract:

- In `sharply`:
  - `npm run check`
- In `sharply-bot`:
  - `npm run lint`
  - `npm run typecheck`
- If command definitions changed:
  - redeploy commands from `sharply-bot`
- If docs metadata changed:
  - confirm the Sharply bot commands page still renders correctly
- If a new endpoint was added:
  - verify unauthorized requests fail
  - verify authorized bot requests succeed

## Anti-Patterns

Avoid these:

- Copying business logic from `sharply` into `sharply-bot`
- Returning Discord-ready strings from `sharply` when structured data would do
- Letting both repos define the same command independently
- Making undocumented contract changes
- Updating bot commands without updating the mirrored manifest
- Treating temporary expedient duplication as permanent architecture

## Default Decision Rule

If ownership is unclear, use this test:

- If it is about Discord behavior, put it in `sharply-bot`.
- If it is about Sharply data or product logic, put it in `sharply`.
- If it crosses both, put the boundary at the internal HTTP contract.
