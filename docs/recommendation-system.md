## Recommendation System

This document describes the structure and flow of the recommendation system used for the “Recommended Lenses” feature. It follows the project’s server layering (data → service → actions) and references the relevant schema, server code, client UI, and utilities.

### Goals

- Curate lens recommendations by brand and chart slug
- Group lenses into clear columns (zoom/prime buckets + optional custom columns)
- Provide lightweight admin editing UX with safe server actions and revalidation

---

## Data Model (Drizzle / PostgreSQL)

Schema definitions live in `src/server/db/schema.ts`.

- Enums
  - `rec_rating` in `recommendationRatingEnum`: `"best value" | "best performance" | "situational" | "balanced"`
  - `rec_group` in `recommendationGroupEnum`: `"prime" | "zoom"`

- Tables
  - `app.recommendation_charts`
    - `id` (PK)
    - `brand` string (lowercase brand key, e.g., `nikon`)
    - `slug` string (per-brand chart slug)
    - `title` string
    - `description` string (optional)
    - `updated_date` date
    - `is_published` boolean
    - Unique: `(brand, slug)`

  - `app.recommendation_items`
    - `id` (PK)
    - `chart_id` FK → `recommendation_charts.id`
    - `gear_id` FK → `gear.id`
    - `rating` `rec_rating`
    - `note` string (optional)
    - Overrides (all optional):
      - `group_override` `rec_group` (forces prime/zoom grouping)
      - `custom_column` string (places item into a named column)
      - `price_min_override`, `price_max_override` (for display only)

Referential integrity is enforced by FKs with cascade on chart deletion; gear references are `restrict`.

---

## Server Layering

Follow `docs/server-structure.md` (no DB in UI; flow is data → service → actions):

- Data layer: `src/server/recommendations/data.ts`
  - Performs raw DB reads/writes for charts and items
  - No auth logic; no caching; minimal shaping

- Service layer: `src/server/recommendations/service.ts`
  - Orchestrates safe, typed operations for UI and actions
  - Examples:
    - `serviceListCharts()` and `serviceListChartParams()` for pickers
    - `serviceGetChart(brand, slug)` returns a fully shaped chart with grouped columns and items
      - Column grouping is composed with utilities below
    - Mutations: `serviceCreateRecommendationChart`, `serviceUpdateChartMeta`, `serviceUpsertItem`, `serviceDeleteItem`
  - Applies auth/role checks for admin endpoints via `requireUser`/`requireRole`

- Actions (Next.js server actions): `src/server/recommendations/actions.ts`
  - Thin wrappers that parse `FormData` (zod) and delegate to the service
  - Revalidates UI paths after successful mutations
  - Never contain direct DB access

---

## Client/UI

- Public pages
  - `src/app/(app)/(pages)/recommended-lenses/[brand]/[slug]/page.tsx`
    - Renders a chart for a brand/slug using `serviceGetChart`
    - Displays grouped columns and item lists

- Admin editor
  - Base page: `src/app/(app)/(pages)/admin/recommended-lenses/[brand]/[slug]/page.tsx`
  - Core editor: `.../_components/EditChartContent.tsx`
    - Uses server actions:
      - `actionUpdateChartMeta` to update title/flags
      - `actionUpsertItem` to add/update an item
      - `actionDeleteItem` to remove an item
    - `GearCombobox` for selecting lens gear (`onlyLenses`)
    - Revalidation: `/admin/recommended-lenses`, `/recommended-lenses`, and the specific brand/slug page

---

## Column Grouping and Display

Utilities in `src/lib/recommendations` control grouping and default columns:

- `bucketing.ts`
  - `mergeDefaultColumns(customCols)` returns a resolved set of column metadata (separate arrays for `prime` and `zoom` groups)
  - `computeColumnKeyFromLensSpecs` derives a default column key from lens specs (prime vs zoom, focal range buckets)
  - Service layer uses these helpers to build `{ columns, itemsByColumn }`

- `columns.ts`
  - Defines default columns (order/labels) for prime/zoom

- `types.ts`
  - Shared types (`Rating`, column keys) used across UI/service

Item placement rules (in order):

1. If `custom_column` is set, place item in that column
2. Else if `group_override` is set, group as specified and derive a default column via `computeColumnKeyFromLensSpecs`
3. Else infer group from lens specs (`lensIsPrime`, `focalMin`, `focalMax`) and compute column key

Prices on the card are derived from `price_min/max_override` if both present; otherwise from `gear.msrp_now_usd_cents` when available.

---

## Admin Workflows

- Create chart (`/admin/recommended-lenses` → New Chart)
  1. `actionCreateRecommendationChart` → `serviceCreateRecommendationChart`
  2. Revalidate admin list and public pages

- Update chart meta (title/published)
  1. `actionUpdateChartMeta` → `serviceUpdateChartMeta`
  2. Revalidate admin and public pages for the chart

- Add or edit item
  1. `actionUpsertItem` → `serviceUpsertItem`
  2. Service computes grouping/columns on read; no denormalized grouping is stored

- Delete item
  1. `actionDeleteItem` → `serviceDeleteItem`
  2. Revalidation on success

All mutations require `ADMIN` or `EDITOR` role (`service.ts` handles enforcement).

---

## Seeding and Local Development

- Seed helper script: `scripts/seed-recommendations.ts`
  - Populates example charts/items for testing
  - Requires a running DB; do not push seeds to production

---

## Conventions

- Brands and slugs are stored lowercase in charts to simplify routing
- UI favors brand/slug URLs: `/recommended-lenses/{brand}/{slug}`
- Keep custom column keys short and URL-safe (no spaces)
- Prefer using `service/` in pages and actions; never import `data/` in UI

---

## Extensibility Notes

- Adding new default columns or rebucketing logic
  - Update `src/lib/recommendations/columns.ts` and/or `bucketing.ts`
  - Ensure `serviceGetChart` continues to shape `{ columns, itemsByColumn }`

- Additional per-item metadata
  - Extend `recommendation_items` with a new column in `schema.ts`
  - Update `data.ts` selects/inserts and `service.ts` return types
  - Document changes here and in related admin UI as needed

---

## File Reference Summary

- Schema: `src/server/db/schema.ts` (tables/enums)
- Data: `src/server/recommendations/data.ts`
- Service: `src/server/recommendations/service.ts`
- Actions: `src/server/recommendations/actions.ts`
- UI (public): `src/app/(app)/(pages)/recommended-lenses/[brand]/[slug]/page.tsx`
- UI (admin): `src/app/(app)/(pages)/admin/recommended-lenses/...`
- Utilities: `src/lib/recommendations/{bucketing,columns,types}.ts`
- Seed: `scripts/seed-recommendations.ts`
