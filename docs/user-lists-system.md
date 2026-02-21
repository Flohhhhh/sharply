# User Lists System

This document describes user-created gear lists, shared list publishing, and profile/gear integrations.

## Overview

- Lists are managed on the profile route (`/u/[handle]`) using client-side dialogs and controls.
- The feature is separate from the existing wishlist system.
- Every user gets a lazily-created default list named `Saved Items`.
- Lists can be published to a shared URL:
  - `/list/[slug]-[publicId]`
  - Example: `/list/my-travel-kit-a79bn3de`

## Database Schema

Defined in `src/server/db/schema.ts`.

### `app.user_lists`

- `id` (PK, text uuid)
- `user_id` (FK -> `app.user.id`, cascade delete)
- `name` (varchar 140)
- `is_default` (boolean)
- `created_at`, `updated_at`

### `app.user_list_items`

- `id` (PK, text uuid)
- `list_id` (FK -> `app.user_lists.id`, cascade delete)
- `gear_id` (FK -> `app.gear.id`, cascade delete)
- `position` (integer, ordered list position)
- `created_at`, `updated_at`
- Unique constraint on `(list_id, gear_id)`

### `app.shared_lists`

- `id` (PK, text uuid)
- `list_id` (FK -> `app.user_lists.id`, cascade delete, unique)
- `slug` (canonical URL slug)
- `public_id` (stable public id, unique)
- `is_published` (boolean)
- `published_at`, `unpublished_at`
- `created_at`, `updated_at`

## Routing + SEO

### Public Shared Route

- Route: `src/app/(app)/(pages)/list/[shared]/page.tsx`
- Rendering mode: `force-dynamic` (no static generation)
- Metadata:
  - `robots: { index: false, follow: false }`
  - Canonical points at the canonical slug + stable `public_id`

### Canonical Behavior

- Resolver identity is the `public_id`.
- If a list name changes, `slug` is updated.
- Old slug URLs with the same `public_id` are redirected to canonical URL.

### Unpublished Behavior

- Shared record remains addressable by `public_id`.
- Page resolves to an unpublished-state view instead of published content.

### Crawler Exclusion

- `/list/` is disallowed in `src/app/(app)/robots.ts`.
- Shared lists are intentionally omitted from sitemap generation.

## Open Graph Image

- Route: `src/app/(app)/(pages)/list/[shared]/opengraph-image.tsx`
- Dynamic OG image includes:
  - List name
  - Owner avatar/name
  - Grid of list items
  - Bottom gradient mask

## Server Layer

Feature follows `data -> service -> actions`.

- `src/server/user-lists/data.ts`
  - Raw DB operations and joins (lists, items, shared records)
- `src/server/user-lists/service.ts`
  - Validation, auth ownership checks, default list enforcement, publish orchestration
- `src/server/user-lists/actions.ts`
  - Client-triggered mutations + revalidation

## UI Integration

### Profile (`/u/[handle]`)

- `src/app/(app)/(pages)/u/_components/lists/user-lists-section.tsx`
- `src/app/(app)/(pages)/u/_components/lists/list-manage-modal.tsx`
- `src/app/(app)/(pages)/u/_components/lists/list-sortable-items.tsx`

Capabilities:

- Create, rename, delete (default list is non-deletable)
- Publish/unpublish + copy share link
- Add items from gear pages using Save Item
- Remove items
- Reorder items via dnd-kit

### Gear Detail

- `src/components/gear/save-item-button.tsx`
- Wired into gear action stack:
  - `src/app/(app)/(pages)/gear/_components/gear-action-buttons.tsx`
  - `src/app/(app)/(pages)/gear/_components/gear-action-buttons-client.tsx`

Behavior:

- Primary click saves to default `Saved Items` list.
- Dropdown allows per-list save/remove and inline list creation.
- Wishlist remains separate and visible.

## Future Migration Note (Wishlist -> Default List)

If wishlist is later retired and replaced by user lists:

- Backfill one default `Saved Items` list per user that only has wishlist data.
- Copy wishlist entries into `app.user_list_items` for that default list, deduping by `(list_id, gear_id)` and assigning stable `position`.
- Update reads/writes to use user-lists service as the single source for save state.
- Remove wishlist UI controls after parity validation (counts, membership, and add/remove behavior).
- Publishing policy after migration: allow publishing the default migrated wishlist with an automatic public title of `"[User display name]'s Wishlist"` and keep that public title non-renameable.
- Decommission wishlist tables/endpoints only after a monitored cutover window and rollback plan.

## Notes for Contributors

- Contributors should change schema in `src/server/db/schema.ts`.
- Do not generate or commit migration files for this feature branch.
