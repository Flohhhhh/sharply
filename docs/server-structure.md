# Server Folder Structure

This document explains how to organize server-only code under `src/server/**`.

## Layers

- **data/** (lowest level)
  - Purpose: raw DB reads/writes; small, composable functions
  - Characteristics:
    - Uses Drizzle directly (`db`, `schema`)
    - No auth, no request/response shaping, no caching
    - Never imported by client or UI code
  - Example files:
    - `server/gear/data.ts`
    - `server/search/data.ts`
    - `server/admin/gear/data.ts`

- **service/** (domain logic)
  - Purpose: safe, reusable server functions for pages, API routes, and server components
  - Responsibilities:
    - Accept meaningful params (e.g., slugs, filters)
    - Perform auth/role checks where necessary
    - Compose multiple `data/*` calls, validate inputs, and shape return values
    - Centralize rules and orchestration
  - Example files:
    - `server/gear/service.ts`
    - `server/search/service.ts`
    - `server/admin/gear/service.ts`

- **actions/** (Next.js Server Actions)
  - Purpose: client-triggered mutations (CRUD) invoked from Client Components
  - Characteristics:
    - Marked with "use server"
    - Thin wrappers that call service functions
    - May call `revalidatePath`/`revalidateTag`
  - Example files:
    - `server/gear/actions.ts`

## Guidelines

- Do not import `db` or `schema` from UI or libs. All DB access belongs in `server/**/data.ts`.
- Prefer importing from `service.ts` in server components and API routes.
- Use server actions only for client-side mutations; do not use actions for pure reads.
- Keep small, testable helpers in `data.ts`; keep business logic and auth in `service.ts`.
- Admin-specific logic lives under `server/admin/**` with its own `data.ts` and `service.ts` per feature.

## Flow (Hierarchy)

- data → service → actions
  - Reads: import from `service.ts` in server components or API routes
  - Mutations from client: call `actions.ts` which delegates to `service.ts`
  - Auth: enforced in `service.ts` (`requireUser`/`requireRole`); actions remain thin wrappers

## Examples

- Gear
  - `server/gear/data.ts`: `getGearIdBySlug`, `fetchGearBySlug`, wishlist/ownership/review writes, stats reads
  - `server/gear/service.ts`: `resolveGearIdOrThrow`, `fetchGearBySlug`, `toggleWishlist`, `toggleOwnership`, `submitReview`, `fetch...Status`
  - `server/gear/actions.ts`: `actionToggleWishlist`, `actionToggleOwnership`, `actionSubmitReview`

- Search
  - `server/search/data.ts`: `buildSearchWhereClause`, `buildRelevanceExpr`, `querySearchRows`, `querySearchTotal`, suggestions queries
  - `server/search/service.ts`: `searchGear`, `getSuggestions`

- Admin
  - `server/admin/gear/data.ts`: `performFuzzySearch`
  - `server/admin/gear/service.ts`: `performFuzzySearchAdmin` (auth + role)

- Metrics (global stats)
  - `server/metrics/data.ts`: `getGearCount`, `getContributionCount`
  - `server/metrics/service.ts`: `fetchGearCount`, `fetchContributionCount`

## Import Rules

- UI/Client Components → call Server Actions (for mutations) or import from `server/**/service.ts` (for reads).
- API Routes → import from `server/**/service.ts`.
- Never import from `server/**/data.ts` outside of `server/**` service layers.
