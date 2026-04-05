# Search System

This document explains how search works in Sharply: routing, URL model, UI surfaces, API shape, DB prerequisites, and the ranking algorithm.

## Surfaces

- `Header` global search: `src/components/layout/header.tsx`
  - Spotlight-style inline search with a floating preview panel.
  - Empty focus opens recent searches only when history exists.
  - Non-empty input stays visually closed until useful suggestions arrive.
  - After non-empty suggestions have appeared once, the panel stays open until the input is cleared.
  - Plain `Enter` prioritizes arrow-key selection, then smart action, then best-match gear, then `/search?q=...`.
- Command palette: `src/components/search/command-palette.tsx`
  - Opens with ⌘K/Ctrl+K or programmatically via `document.dispatchEvent(new CustomEvent("sharply:open-command-palette"))`.
  - Debounced typeahead (200ms) calling `/api/search/suggest`.
  - Uses the same suggestion contract and Enter priority as the header search.
  - Built-in cmdk filtering is disabled so server-ranked results always render.
- Search results page: `src/app/(app)/(pages)/search/page.tsx`
  - Server component; fully driven by `searchParams`.
  - Sort: `relevance` (default), `name`, `newest`.
  - Pagination: `page` (1-based), `pageSize` (internal default 20).

## Routing & URL model

- Route: `/search`
- URL params (extensible):
  - `q`: query text
  - `sort`: `relevance` | `name` | `newest`
  - `page`: number (1-based)
  - Filters (optional): `brand`, `mount`, `gearType`, `priceMin`, `priceMax`, `sensorFormat`

Helper utilities for URLs live in `src/lib/utils/url.ts` (`buildSearchHref`, `mergeSearchParams`).

## API

- Full search (optional for clients): `src/app/(app)/api/search/route.ts`
  - GET params: `q`, `sort`, `page`, `pageSize` (+ future filters)
  - Returns: `{ results, total, totalPages, page, pageSize }`
- Suggest (used by palette): `src/app/(app)/api/search/suggest/route.ts`
  - GET `q`
  - Returns: `{ suggestions: Suggestion[] }`
  - `Suggestion` is a discriminated union:
    - `gear`: region-aware item suggestion with `title`, `subtitle`, `canonicalName`, `localizedName`, `matchedName`, `matchSource`, `brandName`, `relevance`, `isBestMatch`
    - `brand`: brand suggestion with `title`, `subtitle`, `brandName`, `relevance`
    - `smart-action`: currently compare actions with `action: "compare"`, compare slugs/titles, and compare href
  - Compatibility fields `label` and `type` are still emitted for older consumers.

## Database prerequisites

- PostgreSQL `pg_trgm` extension is required for similarity-based ranking and fast `ILIKE` searches.
- Migration: `drizzle/0006_search_trgm.sql`
  - Creates extension if missing
  - Adds a GIN trigram index on `sharply_gear.search_name`
- `gear.search_name` is denormalized to include canonical names plus any regional aliases.

## Core algorithm

Implemented in `src/server/search/data.ts`, `src/server/search/service.ts`, and `src/server/search/query-normalization.ts`.

### Goals

- Tolerant to punctuation/spacing (Z6III vs Z6 III, 70-200 vs 70200)
- Brand should not dominate results
- Avoid over-broad numeric matches (token `70` shouldn’t match everything)
- Use trigram as a ranking signal, not the only gate

### Normalization

- Query normalization: lowercase, trim, remove spaces/underscores/dots/slashes/hyphens → `normalizedQueryNoPunct`.
- Column forms:
  - `searchLower` = `lower(gear.search_name)`
  - `normalizedCol` = `regexp_replace(searchLower, '[[:space:]_.-]+', '', 'g')`
  - Brand-agnostic: `noBrand` = `replace(searchLower, lower(brands.name), '')`
  - `normalizedNoBrand` = `regexp_replace(noBrand, '[[:space:]_.-]+', '', 'g')`

### Tokenization

- Split query on spaces/underscores only (keep hyphens intact): `/[\s_]+/`.
- “Strong tokens” used for substring ILIKE: must contain a letter and be length ≥ 3.
  - Prevents numeric-only tokens (e.g., `70`) from widening results.

### Matching (WHERE clause)

Combined with OR:

- Substring on strong tokens: `gear.search_name ILIKE %token%`
- Normalized contains: `normalizedCol ILIKE %normalizedQueryNoPunct%`
- Brand-agnostic contains: `normalizedNoBrand ILIKE %normalizedQueryNoPunct%`
- Fuzzy (conservative thresholds):
  - `similarity(normalizedNoBrand, normalizedQueryNoPunct) > 0.25`
  - `similarity(gear.search_name, normalizedQueryNoPunct) > 0.33`

### Relevance ranking

Final score uses `GREATEST(...)` to emphasize the strongest signal:

- 1.0 if brand-agnostic normalized contains
- `similarity(normalizedNoBrand, normalizedQueryNoPunct)`
- `similarity(normalizedCol, normalizedQueryNoPunct) * 0.6`
- `similarity(gear.search_name, normalizedQueryNoPunct) * 0.5`

Sort order: `DESC(relevance), ASC(name)` for `relevance`; otherwise `ASC(name)` or `DESC(release_date)`.

### Best-match classification

- Best-match is computed server-side for gear suggestions only.
- A gear result is marked `isBestMatch` only when the normalized query exactly matches one candidate name and no competing gear suggestion shares that exact normalized match.
- Exact candidates include:
  - canonical gear name
  - region-localized display name
  - regional aliases
  - brand-stripped variants for exact item-name entry (for example `z50ii` matching `Nikon Z50 II`)
- Brands never receive implicit direct-open behavior.

### Smart compare parsing

- Suggestion parsing recognizes:
  - `A vs B`
  - `A versus B`
  - `compare A vs B`
- When both sides resolve to strong exact gear matches, the suggest API prepends a `smart-action` row that routes directly to `/compare?...`.
- If either side is ambiguous or weak, no smart action is emitted and the query falls back to normal ranked suggestions.

### Filters

Optional ANDed filters for brand/mount/gearType/price range/sensor format. These are layered on top of the text matching WHERE clause.

### Numeric tokens

- If a query contains two or more significant numeric tokens (integers with ≥3 digits like `400` or decimals like `4.5`), the search additionally requires that all numeric tokens appear in the item’s `search_name`.
- If a query contains exactly one significant numeric token and at least one alphabetic “strong token” (e.g., `nikon z 400`), the match is gated on that numeric token appearing in the item’s `search_name`. This makes mixed queries surface the expected lenses (e.g., `400mm`) without broadly relaxing other matches.
- Decimal numeric tokens are matched with a digit-sequence regex so `f/1.4`, `F1.4`, and the normalized `search_name` form (`f1 4`) all satisfy the same gate.

## Command palette specifics

- UI primitives: `src/components/ui/command.tsx`
  - `CommandDialog` passes `shouldFilter={false}` to cmdk to prevent client-side filtering from hiding server suggestions.
- Behavior: `src/components/search/command-palette.tsx`
  - Debounced fetch while typing (200ms)
  - On open: focus input and eagerly fetch if current query length ≥ 2.
  - Empty input shows recent searches when available.
  - Non-empty input shows smart action rows, best match rows, fallback search action, then remaining suggestions.

## Interaction model

- Loading indicator:
  - The inline header search shows a persistent spinner inside the input as soon as the user starts typing and keeps it visible through the debounced fetch lifecycle.
- Dropdown/panel behavior:
  - Empty input: only recent-search history may open the panel.
  - Non-empty input: the panel waits for useful content before opening.
  - Once useful non-empty content has appeared, the panel remains open until the query is cleared, even if later requests return no direct suggestions.
- Enter behavior:
  - If the user has moved selection with arrow keys, Enter accepts the selected row.
  - Otherwise, smart action wins.
  - Otherwise, a `gear` suggestion with `isBestMatch` wins.
  - Otherwise, Enter navigates to `/search?q=...`.
- Search actions:
  - The UI no longer renders a standalone submit button.
  - Instead it renders a selectable fallback row: `Search for "..."`.
- Naming:
  - Gear rows prefer the localized display name.
  - If the matched alias differs materially from the localized display name, the alias can lead and canonical/localized context moves to secondary text.
- Debug UI:
  - Relevance remains in the payload for ranking/diagnostics but is not shown in production UI.

## SSR & Suspense

- The header is wrapped in a `Suspense` boundary (`src/app/(app)/(pages)/layout.tsx`) so client hooks like `useSearchParams` in the header don’t trip SSR.

## Performance

- GIN trigram index on `search_name` speeds up `ILIKE` and `similarity`.
- Debounce on palette reduces network chatter.
- Minimal fields selected in listing; pagination is fixed page size 20.

## Tuning knobs

Located in `src/server/search/data.ts` and `src/server/search/query-normalization.ts`:

- Token gate: letter presence and `length ≥ 3` for substring ILIKE
- Similarity thresholds: `> 0.25` (brand-agnostic), `> 0.33` (raw column)
- Relevance weights: `1.0` (contains), `1.0` (noBrand sim), `0.6` (normalized sim), `0.5` (raw sim)

Guidance:

- To be stricter: raise similarity thresholds, or require at least one “strong token” match before allowing fuzzy hits.
- To be more permissive: lower thresholds, include short tokens, or add more fields into `search_name`.

## Extensibility

- Add facets: update `SearchFilters` and WHERE filter blocks.
- Add entity types to suggest API (e.g., users): union into output.
- Add sort keys: extend `SearchSort` union; provide corresponding `orderBy`.

## Testing

Manual checks (examples):

- Z6iii → includes “Nikon Z6 III” high; may include “Z6” lower; excludes “Z50ii”.
- 70-200 → includes 70–200 variants; excludes 24–70.
- Brand bias → typing brand alone should not flood irrelevant models.
- `Lumix GF9` → surfaces the GX850 record with alias-aware labeling and canonical/local-name context.
- `z50ii vs a6700` → shows a compare smart action and Enter opens the comparison page.
- Header search stays closed on non-empty input until useful content arrives, then stays open until the input is cleared.
- Plain Enter on a strong exact gear match opens the gear page directly; otherwise it opens `/search?q=...`.
