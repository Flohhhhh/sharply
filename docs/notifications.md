# Notifications (MVP)

In-app notifications for two events:

- Gear spec change requests approved
- Badges awarded

This MVP writes notifications directly at the time of the event (no queue), supports read/archive/delete lifecycle, and is shaped to be fed by a future events ledger without changing the UI model.

## Schema

- Table: `app.notifications`
- Enum: `notification_type` (`gear_spec_approved`, `badge_awarded`)
- Columns: `id`, `user_id`, `type`, `title`, `body`, `link_url`, `source_type`, `source_id`, `metadata` (json), `read_at`, `archived_at`, `created_at`
- Indexes: user + created, user + read, user + archived
- Relations: `notifications.user_id` references `user.id` (cascade delete)

Lifecycle flags:

- Unread: `read_at` is null and `archived_at` is null
- Read: `read_at` set
- Archived: `archived_at` set (read is also set on archive)
- Delete: allowed only when `archived_at` is not null (enforced in data layer)

## Server layering

- Data: `src/server/notifications/data.ts` handles raw DB reads/writes and deletion rule enforcement.
- Service: `src/server/notifications/service.ts` exposes safe helpers, auth-aware fetch for current user, and system creation helper used by domain flows.
- Actions: `src/server/notifications/actions.ts` exposes mutations for client interactions (mark read, archive, delete archived).

Returned shape to UI (`NotificationView`):

- `{ id, type, title, body, linkUrl, sourceType, sourceId, metadata, readAt, archivedAt, createdAt }` (timestamps as ISO strings).

## Emission points (direct)

- Gear spec approval: `src/server/admin/proposals/service.ts` creates `gear_spec_approved` notification for the proposal author with `linkUrl` `/gear/{slug}` and metadata `{ proposalId }`.
- Badge awards: `src/server/badges/service.ts` creates `badge_awarded` notification when a badge is newly inserted, with badge label/description and `linkUrl` `/u/{userId}` plus metadata `{ badgeKey, eventType }`.

## UI

- Header dropdown (popover) trigger near the theme switcher, only when signed in.
- `src/components/layout/header.tsx` builds only the locale-scoped header shell on the server so shared ISR routes stay static-safe.
- `src/components/layout/header-client.tsx` derives compact vs expanded route state from `usePathname()`, keeps query-string callback enrichment isolated behind a `Suspense` boundary for `useSearchParams()`, and mounts a client-only shared-header notifications provider after session hydration.
- Shared header notifications use SWR against `/api/notifications/header` with:
  - revalidation on focus and reconnect
  - a 30 second polling interval
  - optimistic read/archive/delete updates followed by background revalidation
  - zero notification requests while the session is still pending or the user is signed out
  - full active and archived notification sets returned by the header API; the dropdown no longer uses paged notification slices
- The shared-header SWR provider is mounted only inside the shared header subtree. It must not be moved into `src/app/[locale]/providers.tsx` or shared server layout chrome.
- Client UI: `src/components/layout/notifications/notifications-dropdown.tsx`
  - Presentational only; renders the current notification state and delegates mutations via callbacks.
  - Shows unread count badge on the bell button.
  - Active list (not archived) with actions: mark read, archive.
  - Archived section with delete action (only allowed when archived).
  - Uses provided notification text; UI does not construct messages.
- Admin header notifications remain server-seeded in the current pass and still use local optimistic state rather than the shared-header SWR provider.
  - It now reads the full active and archived notification sets instead of server-side notification pages.

## Future ledger compatibility

- `sourceType`, `sourceId`, and `metadata` support pointing to future event records.
- When an events ledger is introduced, notification creation can move to projection code without changing the table or UI contract.

## Customizing notification copy

- Gear spec approved: update the `createNotification` payload in `src/server/admin/proposals/service.ts` (type `gear_spec_approved`).
- Badge awarded: update the `createNotification` payload in `src/server/badges/service.ts` inside `evaluateForEvent` (type `badge_awarded`).
- Test notifications (admin button): edit sample payloads in `src/server/notifications/actions.ts` (`actionSendTestNotification`).

## Adding a new notification type
1. Add the new type to `notification_type` enum in `src/server/db/schema.ts`.
2. Emit the notification via `createNotification` from a service (not UI/client). Follow the data → service → actions layering.
3. Add an icon mapping (and any type-specific display tweaks) in `src/components/layout/notifications/notification-item.tsx`.
4. Optionally add a test payload in `src/server/notifications/actions.ts` (`actionSendTestNotification`) for manual testing.
5. Update this doc with the new type’s purpose and emission point.
