# Community Bingo (Polling-Based)

This feature adds a shared, low-stakes community bingo board backed by the primary database.

## Architecture

- **Source of truth**: PostgreSQL tables in `src/server/db/schema.ts`.
- **Mutations**: service/action flow in `src/server/community-bingo`.
- **Reads**: SWR polling through:
  - `GET /api/community-bingo/board`
  - `GET /api/community-bingo/activity`

## Data model

- `community_bingo_boards`: board lifecycle (`ACTIVE`, `COMPLETED`, `ARCHIVED`, `EXPIRED`) and inactivity-expiration timestamps (`inactivity_expires_at`, `expired_at`).
- `community_bingo_tiles`: board tiles persisted per board (seeded from `src/server/community-bingo/tiles.ts`), with completion attribution and proof pointer.
- `community_bingo_submissions`: submitted Discord message link and parsed IDs.
- `community_bingo_scores`: points + claims per user/board.
- `community_bingo_events`: explicit event log for UI animation/highlight reactions.

## Validation boundary

All submission checks run through one entrypoint:

- `CheckSubmissionValidity(...)` in `src/server/community-bingo/validation.ts`.

Current checks are intentionally minimal:

- required field presence and shape
- URL format
- Discord message link pattern (`/channels/{guild}/{channel}/{message}`)
- tile still claimable

Future bot/LLM validation can be added behind this same boundary without changing callers.

## Inactivity expiration

- Timer starts on the **first completed tile**.
- Every additional tile completion **extends/resets** the inactivity expiry.
- If the board reaches `inactivity_expires_at` with no new completion, it transitions to `EXPIRED`.
- Expiration is a distinct outcome from completion (`COMPLETED`), and the UI treats both differently.

## Event-oriented UI

Event records are explicit and transport-agnostic. Current events include:

- `submission_created`
- `tile_completed`
- `score_changed`
- `board_completed`
- `board_archived`
- `new_board_created`
- `board_expiration_timer_started`
- `board_expiration_timer_extended`
- `board_expired_inactivity`

This supports polling today and can later support SSE/websocket/bot-driven updates.
