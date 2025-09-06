# Badge System — Architecture, Usage, and Future Work

A lightweight, event-driven badge system with a single catalog, small generators for ladders, clear storage, and DX-friendly server/client utilities.

## Overview

- Catalog-driven definitions live in `src/lib/badges/` (safe for client import when you only need metadata).
- Server-only logic (snapshot, evaluation, writes) lives in `src/server/badges/`.
- UI components for display/toasts live in `src/components/badges/` and profile pages.
- Events are emitted from your app code (wishlist/ownership/review/etc.) and routed to only those badges that subscribe to that trigger.

## Key Modules

- Catalog (definitions)
  - `src/lib/badges/catalog.ts` — exports `BADGE_CATALOG`, `validateBadgeCatalog`, and `buildTriggerIndex`.
  - `src/lib/badges/constants.ts` — `ALLOWED_TRIGGERS` and types for triggers.
- Generators
  - `createThresholdBadgeLadder` — metric-based ladders (e.g., wishlist count, approved reviews).
  - `createTimeBadgeLadder` — time-based ladders (e.g., tenure since join date). Uses `context.now` for evaluation.
- Server
  - `src/server/badges/data.ts` — `getUserSnapshot`, `upsertUserBadge` (idempotent insert + logging), reads.
  - `src/server/badges/service.ts` — `evaluateForEvent`, `dryRunForEvent`, `fetchRecentAwards`, `fetchUserBadges`, `awardBadgeForce`.
  - Idempotent write: `upsertUserBadge` returns a boolean indicating whether an insert occurred (used to avoid duplicate toasts).
- UI
  - `src/components/badges/badge-tile.tsx` — the small badge tile with roman level chip.
  - `src/components/badges/badge-toast.tsx` — `BadgeToast`, `showBadgeToast`, `showBadgeToastByKey`, `announceAwards`, `withBadgeToasts` (Sonner-based helpers).
  - `src/app/(pages)/u/_components/user-badges.tsx` — profile layout with sorting and tooltips.
  - Admin: `src/app/(admin)/admin/badges-catalog.tsx` (viewer), `badges-test-toast.tsx` (test button), and `badges-awards-list.tsx` (recent awards).
- Cron
  - `GET /api/admin/badges/anniversary` (secured by `CRON_SECRET`) emits `cron.anniversary` for users whose join month/day is today, passing `{ now }` in context.

## Storage

- `app.user_badges`
  - Columns: `user_id`, `badge_key`, `awarded_at`, `source` (auto/manual), optional `context`, optional `sort_override`.
  - PK uniqueness on `(user_id, badge_key)` prevents duplicates.
- `app.badge_awards_log` (append-only)
  - Columns: `id`, `user_id`, `badge_key`, `event_type`, `source`, `context`, `awarded_at`.

## Triggers and Event Flow

- Allowed triggers are listed in `ALLOWED_TRIGGERS` and validated at boot.
- App code emits an event: `evaluateForEvent({ type: "wishlist.added", context }, userId)`.
- Evaluator loads a single snapshot per user, runs only subscribed badge tests, and upserts awards idempotently.
- The evaluator returns `{ awarded, skipped }` — we only toast on `awarded.length > 0`.

## Generators and Labels

- Threshold ladder (metric-based)
  - Use `createThresholdBadgeLadder` with: `baseKey`, `family`, `iconComponent`, `color`, `trigger`, `levels`, `metric`, `labelBase`, and `descriptionFor`.
  - Automatically sets `level` and `levelIndex`; `sortScore` defaults to the index unless overridden.
- Time ladder (anniversaries)
  - Use `createTimeBadgeLadder` with: `baseKey`, `family`, `iconComponent`, `color`, `trigger`, `durationsDays`, `labelBase`, and `descriptionFor`.
  - Evaluates tenure from the user's join date; pass `{ now }` in `context` for cron.
- Labels automatically include roman tier numerals based on ladder index, using `toRomanNumeral` from `src/lib/utils.ts`.

## Manual-Only Badges

- Define an individual badge with a no-op `test` and a `triggers: ["manual.award"]` (add to `ALLOWED_TRIGGERS`).
- Award via `awardBadgeForce({ userId, badgeKey })`. It’s idempotent and returns `{ awarded: boolean }`.

## Adding a new badge (step-by-step)

- Choose badge type
  - Threshold ladder: based on a numeric metric (e.g., wishlistCount).
  - Time ladder: based on tenure since `joinDate` (e.g., anniversaries).
  - Manual-only: granted explicitly by admins or niche flows.
- Add definition to catalog
  - Open `src/lib/badges/catalog.ts` and add a new entry using the appropriate generator (threshold/time) or a single definition for manual.
  - Provide: `baseKey`, `family`, `iconComponent`, `color`, `trigger`, `labelBase`, `descriptionFor`, and either `levels`/`metric` (threshold) or `durationsDays` (time).
  - Roman numerals are appended automatically by ladder generators.
- Ensure metrics exist
  - If your threshold badge uses a new metric, add it to `UserSnapshot` in `src/types/badges.ts` and compute it in `getUserSnapshot` in `src/server/badges/data.ts`.
- Wire event trigger
  - Pick a trigger from `ALLOWED_TRIGGERS` in `src/lib/badges/constants.ts` (add a new one only if necessary).
  - From the relevant service layer, call `evaluateForEvent({ type: "your.trigger", context }, userId)` after the domain action.
  - For time-based badges, ensure the cron route emits `cron.anniversary` (or an appropriate time event) with `{ now }`.
- Sorting and presentation
  - `sortScore` is set automatically for ladders; use `sortOverride` in `user_badges` only for manual adjustments.
  - Set `labelBase` and `descriptionFor` to explain how the badge is earned; color/icon are used in UI.
- Client toasts
  - For client-initiated mutations, prefer `withBadgeToasts(yourAction(...))` so any `{ awarded }` keys toast automatically.
  - For manual/admin grants, wrap the client call in `withBadgeToasts` and toast only when the result indicates a new award.
- Test
  - Trigger the event in dev; verify a new row in `user_badges`, a log entry in `badge_awards_log`, and the badge appearing on the user profile.
  - Use the Admin Catalog to visually verify metadata, and the Admin Awards list to see recent awards.

## Usage Examples

- Step-by-step flow (typical mutation → evaluation → client toast)
  1. Mutation handler performs domain action, then calls `evaluateForEvent({ type, context }, userId)`.
  2. Return `{ awarded }` keys from the handler.
  3. On the client, prefer `withBadgeToasts(promise)` to automatically show toasts for new awards; it returns the original result.
  4. Alternatively, call `announceAwards(res.awarded)` manually.
  5. For cron/manual flows, follow the same return contract so the client can toast consistently.

- Emit events from a server action (wishlist add):

```ts
// server/gear/service.ts
const evalRes = await evaluateForEvent(
  { type: "wishlist.added", context: { gearId } },
  userId,
);
return { ok: true, action: "added" as const, awarded: evalRes.awarded };
```

- Toast in the client (preferred):

```tsx
// gear-action-buttons.tsx (client)
import { withBadgeToasts } from "~/components/badges/badge-toast";

const res = await withBadgeToasts(actionToggleWishlist(slug));
```

- Toast in the client (manual alternative):

```tsx
import { announceAwards } from "~/components/badges/badge-toast";

const res = await actionToggleWishlist(slug);
announceAwards(res.awarded);
```

- Manual grant:

```ts
// server
const result = await awardBadgeForce({ userId, badgeKey: "learner" });
// result.awarded === true only if a new badge row was inserted
```

- Manual grant (client toast):

```tsx
// admin panel (client), after calling the manual grant action
import { withBadgeToasts } from "~/components/badges/badge-toast";

const res = await withBadgeToasts(actionAwardBadgeForce(userId, "learner"));
```

## Sorting & Display

- Profile sorting: `sortOverride ?? sortScore` (desc) then `awardedAt` (desc).
- Roman chip shows ladder index (`levelIndex`) only for ladder badges; individual badges are icon-only.

## Validation & Guardrails

- `validateBadgeCatalog(BADGE_CATALOG)` runs at boot to ensure:
  - Unique keys
  - Triggers are in `ALLOWED_TRIGGERS`
  - `test` is a function
- Keep `ALLOWED_TRIGGERS` short and stable.

## Admin Utilities

- Badge Catalog Viewer — lists all catalog entries, triggers, sort metadata.
- Recent Badge Awards — stream of latest awards.
- Test Toast Button — fires a sample badge toast via the shared component.

## Cron: Anniversary

- Route: `GET /api/admin/badges/anniversary`
- Security: header `Authorization: Bearer ${CRON_SECRET}`
- Logic: select users whose `emailVerified` month/day is today, then

```ts
evaluateForEvent(
  { type: "cron.anniversary", context: { now: Date.now() } },
  userId,
);
```

- Logs: start/end timestamps, users processed, total awards.

## Notes on Toasting

- Toasters are client-only; we toast in the client after actions by reading `res.awarded`.
- Idempotency: `upsertUserBadge` returns `didInsert` so server-only flows can avoid duplicate announcements; the client already only toasts when `awarded.length > 0`.
- Manual grants: follow the same client toast pattern; prefer `withBadgeToasts` to reduce duplication.

## TODO / Future Improvements

- Less repetitive toasts
  - Add an `announceAwards(keys)` helper used everywhere, or a global `BadgeToastListener` that listens for a `badge:awarded` window event.
  - A thin client wrapper like `withBadgeToasts(promise)` that awaits an action returning `{ awarded }` and announces automatically.
- Pending notifications
  - Add an `announced_at` column or a `pending_badge_notifications` table to surface toasts on next client session for cron/admin awards.
- Catalog viewer polish
  - Group by family; quick filters; search by key/trigger; open badge preview (icon/color/description).
- Profile UX
  - Group ladders by family; “See all” pagination when badge lists get large; accessibility labeling & keyboard focus.
- Additional ladders & badges
  - `compare.used` ladder; more individual badges; staff-awarded pathways via admin.
- Data and indexing
  - Index `app.user_badges(user_id, awarded_at)`; optional `badge_awards_log(badge_key, awarded_at)` for reporting.
- Tests & CI
  - Unit tests for generators (time and threshold); CI step that imports and validates catalog.
- Internationalization
  - Make labels/descriptions i18n-friendly; consider deferring to translation layer.

---

If you’re adding a new badge, prefer a ladder via the generators when possible; otherwise define a single badge with a clear trigger and a minimal test (or use `awardBadgeForce` for purely manual cases).
