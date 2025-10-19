## Compare Page — Implementation Notes (MVP)

This document describes the current implementation of the Compare page and related UX, and captures future plans that extend the design in `docs/compare-tool-plan.md`.

### Purpose

Enable a fast, two-item comparison experience with clean URLs, local-only persistence, and minimal UI that degrades gracefully when data is incomplete.

### Routing and URLs

- Canonical query URL: `/compare?i=slugA&i=slugB`
  - Uses exact `gear.slug` values; no re-slugging.
  - Slugs are sorted alphabetically to produce a stable link.
  - Helper: `buildCompareHref(slugs)` in `src/lib/utils/url.ts`.
- Future (planned): pretty editorial URLs like `/compare/slug-a-vs-slug-b` with a redirect to the canonical query URL when no staff editorial exists.

### Data Fetch & Composition

- Server page at `src/app/(app)/(pages)/compare/page.tsx`:
  - Reads up to two `i` query params and sorts them.
  - Fetches both `GearItem`s via service: `fetchGearBySlug`.
  - Renders a large heading: “Brand Model vs Brand Model”. Brand is bolded; brand tokens are stripped out of the model name using helpers in `src/lib/mapping/brand-map.ts`.
  - Delegates client-side presentation to `CompareClient`.

### Client Presentation

- `src/components/compare/compare-client.tsx`
  - Mobile: simplified two-card list (links to gear pages) when on small screens or when either item is missing.
  - Desktop: renders `CompareSpecsTable` with both items.

### Spec Table Behavior

- `src/components/compare/compare-specs-table.tsx`
  - Builds both sides through `buildGearSpecsSections` (`src/lib/specs/registry.tsx`).
  - Rows are only shown when both sides have a non-null value.
  - Booleans are consistently formatted with `yesNoNull`, which returns undefined for nulls so empty rows are dropped.
  - Special-case guards:
    - Release Date only renders if present.
    - Sensor Type composes a multi-part label and hides when empty.
    - Card Slots hides when the slot array is empty.
  - Construction-state gating: if either item is “under construction” (see `getConstructionState` in `src/lib/utils.ts`), the table switches to the empty/CTA view.
  - Auth-aware empty state:
    - Signed out: banner asking the user to log in to contribute.
    - Signed in: shows a per-item missing-spec count and lists missing keys; includes `SuggestEditButton` links to contribute edits.

### Guided Empty State (no query params)

- When no `i=` params are provided, the page renders a centered empty state with:
  - Header: “Nothing to compare yet”.
  - CTA copy: “Search for 2 items and add them to the comparison to see how they stack up.”
  - Button: opens the global Command Palette (via `OpenSearchButton`).

### Global Compare UX

- State: `useCompare` context in `src/lib/hooks/useCompare.tsx` (localStorage only).
  - Actions: `add`, `remove`, `clear`, `replaceAt`, `addOrReplace`.
  - Enforces same-type comparisons (cameras with cameras, lenses with lenses).
  - Integrates toasts for feedback.
- FCB (Floating Compare Button): `src/components/compare/floating-compare-button.tsx`
  - Bottom-left placement (adds a dev offset for Vercel toolbar).
  - Empty state: outline icon-only button with `<Scale />` that opens the Command Palette.
  - Chips show when items are present; Compare button clears the queue before navigating.
  - Clear button is icon-only, outlined, placed to the left of the chips.

### Popularity Tracking

- Per-gear popularity events fire on add/replace in the compare queue:
  - Server action: `actionRecordCompareAdd` in `src/server/popularity/actions.ts`.
  - Service/data: `src/server/popularity/service.ts` and `src/server/popularity/data.ts`.

- Pair-level counts (minimal, no rollups):
  - Schema: `app.compare_pair_counts` via `comparePairCounts` in `src/server/db/schema.ts`.
    - Composite PK `(gear_a_id, gear_b_id)` with canonical ascending order by id.
    - Denormalized `pair_key` retains current sorted slugs; refreshed on increment.
  - Trigger: `ComparePairTracker` client component increments a per-pair counter on page view when both items resolve.
    - Renders in `src/app/(app)/(pages)/compare/page.tsx` only when both `a` and `b` exist.
    - Calls server action `actionIncrementComparePairCount(slugs)`.
    - Uses a short-lived cookie `comparePair:<slugA|slugB>` (30 minutes) for optimistic dedupe per browser.
  - Service/data: `incrementComparePairCount` → `incrementComparePairCountBySlugs` performs atomic upsert with `ON CONFLICT (gear_a_id, gear_b_id) DO UPDATE SET count = count + 1` and refreshes `pair_key`.
  - Pair key is a stable, sorted join of slugs: `slugA|slugB`.

### Editorial Comparisons (planned)

- CMS (Payload) content type linking two gear items by slug or ID, plus verdict and rationale bullets.
- Delivery model:
  - Statically generate selected editorial pairs.
  - Dynamic compare remains on the canonical query URL.
  - Optional pretty path `/compare/a-vs-b` redirects to the canonical URL unless a static editorial exists.

### Page Structure (draft)

- Header
  - Large title: “Brand Model vs Brand Model”.
  - Optional share/copy link to canonical URL (planned).
- Identity Row (mobile)
  - Two compact cards with names and links; swap affordance (planned).
- Desktop Content
  - Spec Table with section headers, three equal columns (label, A, B).
  - Filters: “show differences only” (planned).
  - Sticky section headers (planned).
- Empty/Construction States
  - Guided empty state (implemented).
  - Construction notices summarize missing keys and link to contribute (implemented in-table when signed in).

### Components Inventory

- ComparePage (server): `src/app/(app)/(pages)/compare/page.tsx`
- CompareClient (client): `src/components/compare/compare-client.tsx`
- CompareSpecsTable (client): `src/components/compare/compare-specs-table.tsx`
- OpenSearchButton (client): `src/components/search/open-search-button.tsx`
- FloatingCompareButton (client): `src/components/compare/floating-compare-button.tsx`
- AddToCompareButton (client): `src/components/compare/add-to-compare-button.tsx`
- Registry & Formatters (server/shared): `src/lib/specs/registry.tsx`

### Copy & Accessibility

- Empty states use clear, concise language.
- Buttons use Shadcn components with accessible labels and focus states.
- Table rows avoid rendering placeholders and honor “both sides must have a value”.

### Future Enhancements (not yet implemented)

- Mobile “Key Notes” strip and “Highlighted Differences” list.
- Differences-first toggle on desktop, with subtle better/worse cues.
- Swap order action; chip-based quick actions in the header.
- Copy/Share link in header and inside the FCB.
- “Often compared with” suggestions powered by event data.
- Pair-level popularity aggregation service and scheduled rollups to suggest SSG/editorials.
- Staff Decision Banner when CMS editorial exists.

### QA Snapshot (MVP)

- Two-item limit enforced across surfaces; replace flow guarded with toasts.
- Canonical compare URL always sorted and shareable.
- Signed-out guided empty state appears with functional “Open search” button.
- Signed-in missing-data view lists spec gaps and offers edit CTAs.
- Table hides rows correctly when either side lacks a value; boolean nulls do not display “No”.

See also: `docs/compare-tool-plan.md` for broader roadmap and architectural notes.
