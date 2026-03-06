# Discord Community Bingo

Polling-driven collaborative bingo board for the Discord community.

## Route

- Page: `/discord/bingo`
- API:
  - `GET /api/discord/bingo/board`
  - `GET /api/discord/bingo/events?since=<cursor>`
  - `GET /api/discord/bingo/leaderboard`
  - `POST /api/discord/bingo/claim`
  - `POST /api/discord/bingo/skip` (admin only)
  - `POST /api/discord/bingo/complete` (development only)

## Data Model

Defined in `src/server/db/schema.ts`:

- Enums:
  - `bingo_board_status`: `ACTIVE | COMPLETED | EXPIRED | ARCHIVED`
  - `bingo_event_type`: `tile_completed | submission_created | score_updated | board_completed | board_expired | board_created | inactivity_timer_started | inactivity_timer_extended`
- Tables:
  - `app.bingo_boards`
  - `app.bingo_board_tiles`
  - `app.bingo_submissions`
  - `app.bingo_scores`
  - `app.bingo_events`

Board template behavior:

- each new board samples exactly 24 random labels from `BINGO_TEMPLATE_LABELS`
- center tile is always `Free Tile` (auto-completed)
- total board size remains 25 tiles
- if an existing active board has invalid tile shape (wrong count/free tile), it is auto-rotated to a fresh valid board on read

## Server Structure

Follows `data -> service -> actions`:

- `src/server/bingo/data.ts`: raw DB reads/writes only
- `src/server/bingo/service.ts`: orchestration and business rules
- `src/server/bingo/actions.ts`: server action wrapper for client-triggered mutations

## Validation Boundary

All submission checks go through:

- `CheckSubmissionValidity(input): boolean` in `src/server/bingo/validation.ts`

Current checks:

- required fields exist
- Discord message URL parses as `/channels/{guild}/{channel}/{message}`
- board/tile claimability

The same entrypoint is reserved for future Discord bot and LLM-backed validation.

## Inactivity Lifecycle

- Default inactivity window: 4 hours
- Timer starts on first successful non-free tile claim
- Every claim resets `expires_at` to `now + inactivity_duration`
- On inactivity expiry:
  - board status changes to `EXPIRED`
  - `board_expired` event is emitted
  - next board is created immediately

## Frontend Behavior

- SWR polling every 5 seconds for board/events/leaderboard
- optimistic claim UI with rollback on failure
- event-driven tile reactions and confetti on tile completion
- board completion handoff transition:
  - board collapses out,
  - `CARD COMPLETED!` interstitial appears,
  - top-3 podium (gold/silver/bronze) from completed-board leaderboard is shown,
  - next board fades in after a short client delay
- control buttons:
  - `Skip Card` appears for admins and rotates to the next board
  - `Complete Card` appears in development and forces completion rotation for transition testing
- desktop-first fixed view with mobile fallback message:
  - `Bingo is only available on desktop`

## Board-Created Event Payload

`board_created` event payload now includes a source marker:

- `source: "initial" | "completion" | "inactivity"`
- completion payloads additionally include:
  - `previousBoardId`
  - `previousLeaderboardTop3` with ranked top-3 rows for transition UI
