# Gear Browse Routing

This document describes the dynamic, parameterized browsing system under `/browse` using a single catch-all route that maps to the fixed hierarchy:

- `/browse`
- `/browse/[brand]`
- `/browse/[brand]/[category]`
- `/browse/[brand]/[category]/[mount]`

Notes:

- `/gear` and `/brand/[slug]` are redirected to `/browse` equivalents via `next.config.js` redirects.
- Mount `shortName` (from `src/server/db/schema.ts` mounts.short_name) is used for the final segment.

## Files

- `src/app/[locale]/(pages)/browse/layout.tsx` — shared layout
- `src/app/[locale]/(pages)/browse/[[...segments]]/page.tsx` — catch-all route
- `src/app/[locale]/(pages)/browse/_components/*` — depth-specific view components
- `src/app/[locale]/(pages)/browse/_components/mount-buttons.tsx` — brand/type mount buttons
- `src/lib/browse/routing.ts` — parsing and depth logic
- `src/lib/browse/filters.ts` — query params → filters
- `src/server/gear/browse/data.ts` — data helpers (brands/mounts derived from constants)
- `src/server/gear/browse/service.ts` — orchestration, SEO builders
- `src/lib/browse/mount-ui.ts` — UI config for mount ordering/visibility
- `src/app/sitemap.ts` — generates browse URLs for sitemap
- `next.config.js` — redirects for legacy `/gear` and `/brand/[slug]` paths

## Depth Behavior

- 0 segments: Global hub; applies brand affinity cookie for default brand context but never redirects.
- 1 segment: Brand hub.
- 2 segments: Brand + category browse (always-on filters and mount chips).
- 3 segments: Brand + category + mount minimal list.

## Filters (via query params)

- `sort` (browse): `newest` (default for cameras/brand/all lens pages), `focal_length` (default for lens mount pages), `price_asc`, `price_desc`, `popularity` (no `relevance` on browse)
- `sort` (search): defaults to `relevance`
- `page`, `perPage` (defaults: 1, 24; `perPage` max 96)
- Traits: `minPrice`, `maxPrice`, `minRating`, `minYear`, `maxYear`, `sensor`
- Category-specific: lenses (`minFocal`, `maxFocal`, `minAperture`, `maxAperture`), cameras (`minMp`, `maxMp`, `minIso`, `maxIso`)
- Use cases: `useCase` (CSV)

## SSG/ISR

- Static params are generated in the page (`[[...segments]]/page.tsx`) with an explicit build-budget filter:
  - only the default locale (`en`) is prebuilt for the heavy browse route family
  - prebuilt browse paths are limited to:
    - `/browse`
    - `/browse/[brand]` for all `BRANDS`
    - `/browse/[brand]/[cameras|lenses]`
  - mount-depth browse routes (`/browse/[brand]/[category]/[mount]`) are left to on-demand ISR
- `export const revalidate = 3600` (1 hour) for ISR.
- `dynamicParams = true` so non-prebuilt combinations still render on-demand.
- `getPopularScopes` is deprecated and no longer used.

## Gear Detail SSG/ISR

- `src/app/[locale]/(pages)/gear/[slug]/page.tsx` also applies a build-budget filter.
- Only the default locale (`en`) is prebuilt for gear detail pages.
- Even within `en`, static params are limited to the deduped union of the configured trending, newest, and high-traffic slug lists.
- Non-default locales and any non-prebuilt slugs fall back to on-demand ISR because `dynamicParams = true`.

## Metadata

- Built in `generateMetadata` via service builder.
- Browse index special-cases title/description.
- Canonical URLs use `NEXT_PUBLIC_BASE_URL` and `/browse/...` path.
- Gear detail pages now prefer a stored `gear.ogImageUrl` for `og:image` and Twitter metadata.
- If a gear item has not been backfilled yet, metadata falls back to `thumbnailUrl`.
- No localized runtime gear OG image route is used for gear detail pages.

## Mapping System Update

- Routing uses `MOUNTS.short_name` for the `[mount]` segment (e.g., `z` vs `z-nikon`). See `docs/mapping-system.md` for relationship considerations.

### Mount button ordering/visibility

- Rules come from `src/lib/browse/mount-ui.ts` per `brandSlug` and category (`"cameras" | "lenses"`).
- Config supports `order` (desired short_name sequence) and `hide` (short_names to hide).
- Auto-hide: mounts with null/empty `short_name` are hidden from the main grid but included in "Other mounts".
- Current defaults:
  - Nikon: show `z`, `f` (in that order); hide `nikon1`, `s`.
  - Canon: show `rf`, `ef`, `efm` (in that order).

## UI Notes

- Depth 0 (`/browse`): Featured brand buttons, Latest Gear, Trending Gear; no breadcrumbs.
- Depth 1: Large buttons for Cameras/Lenses.
- Depth 2: Large buttons for mounts; filter dialog + pills; "showing X results".
  - Mount layout (after filtering/auto-hide):
    - 1 mount → hidden
    - 2 mounts → 2 full-width buttons
    - 3 mounts → 3 full-width buttons
    - 4+ mounts → 2 columns (rows of two)
  - Hidden mounts appear in a centered "Other mounts" popover.
- Depth 3: No mount buttons; filter dialog + pills; "showing X results".
- Breadcrumbs render for depths ≥ 1.
