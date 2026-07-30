# Preferred Profile Filters

Users can save a preferred brand and preferred mount from `/profile/settings`.

## Behavior

- The settings UI stores nullable `preferredBrandId` and `preferredMountId` on `app.user`.
- The preferred mount field stays disabled until a preferred brand is selected.
- Mount options are filtered to the selected brand.
- Changing the preferred brand clears any previously selected mount that no longer matches.
- The helper copy explains intended future use: these preferences may become default filters on some list pages, but they do not affect search or browse pages.

## Server Flow

- `src/server/users/data.ts` performs the raw read/write helpers for preference persistence and mount validation lookups.
- `src/server/users/service.ts` validates:
  - mount cannot be saved without a brand
  - mount must belong to the selected brand
  - clearing the brand clears the mount
- `src/server/users/actions.ts` exposes the mutation and revalidates `/profile/settings`.

## Auth Session Fields

Better Auth now includes these additional user fields so `session.user` stays aligned after updates:

- `preferredBrandId`
- `preferredMountId`

## Current Scope

This change only stores and edits the preferences in account settings.

- No homepage, list, collection, wishlist, search, or browse pages consume them yet.
- Search and browse behavior remains unchanged as of July 29, 2026.
