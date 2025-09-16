# Search System

This document explains how search works in Sharply: routing, URL model, UI surfaces, API shape, DB prerequisites, and the ranking algorithm.

## Surfaces

- `Header` global search: `src/components/layout/header.tsx`
  - Input submits to `/search?q=...`, preserves existing params, resets `page=1`.
  - “⌘K/Ctrl K” hint opens the command palette.
- Command palette: `src/components/search/command-palette.tsx`
  - Opens with ⌘K/Ctrl+K or programmatically via `document.dispatchEvent(new CustomEvent("sharply:open-command-palette"))`.
  - Debounced typeahead (200ms) calling `/api/search/suggest`.
  - Built-in cmdk filtering is disabled so server-ranked results always render.
- Search results page: `src/app/(pages)/search/page.tsx`
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

- Full search (optional for clients): `src/app/api/search/route.ts`
  - GET params: `q`, `sort`, `page`, `pageSize` (+ future filters)
  - Returns: `{ results, total, totalPages, page, pageSize }`
- Suggest (used by palette): `src/app/api/search/suggest/route.ts`
  - GET `q`
  - Returns: `{ suggestions: Array<{ id, label, href, type, relevance? }>} `

## Database prerequisites

- PostgreSQL `pg_trgm` extension is required for similarity-based ranking and fast `ILIKE` searches.
- Migration: `drizzle/0006_search_trgm.sql`
  - Creates extension if missing
  - Adds a GIN trigram index on `sharply_gear.search_name`

## Core algorithm

Implemented in `src/lib/utils/search.ts` (export: `searchGear`).

### Goals

- Tolerant to punctuation/spacing (Z6III vs Z6 III, 70-200 vs 70200)
- Brand should not dominate results
- Avoid over-broad numeric matches (token `70` shouldn’t match everything)
- Use trigram as a ranking signal, not the only gate

### Normalization

- Query normalization: lowercase, trim, remove spaces/underscores/dots/hyphens → `normalizedQueryNoPunct`.
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

### Filters

Optional ANDed filters for brand/mount/gearType/price range/sensor format. These are layered on top of the text matching WHERE clause.

### Numeric combos

For queries containing at least two numeric tokens (e.g., integers with ≥3 digits like `400` or decimals like `4.5`), the search requires that all numeric tokens appear in the item name. This minimally improves cases like `"400 4.5"` matching lenses named `"400mm f/4.5"` without broadening other matches.

## Command palette specifics

- UI primitives: `src/components/ui/command.tsx`
  - `CommandDialog` passes `shouldFilter={false}` to cmdk to prevent client-side filtering from hiding server suggestions.
- Behavior: `src/components/search/command-palette.tsx`
  - Debounced fetch while typing (200ms)
  - On open: focus input, clear results if query is empty, and eagerly fetch if current query length ≥ 2 (prevents “no results until reopen”).

## SSR & Suspense

- The header is wrapped in a `Suspense` boundary (`src/app/(pages)/layout.tsx`) so client hooks like `useSearchParams` in the header don’t trip SSR.

## Performance

- GIN trigram index on `search_name` speeds up `ILIKE` and `similarity`.
- Debounce on palette reduces network chatter.
- Minimal fields selected in listing; pagination is fixed page size 20.

## Tuning knobs

Located in `src/lib/utils/search.ts`:

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
- Palette open with 2+ char query shows immediate suggestions; empty opens show “No results” until typing.
