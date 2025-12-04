# Popularity Tracking System

This document describes the end‑to‑end popularity tracking in Sharply: ingestion, storage, rollups, APIs, caching, UI integrations, and operations.

## Architecture Overview

- **Ingestion (append‑only events)**
  - API routes under `app/api/gear/[slug]/…` record canonical events:
    - `view`, `wishlist_add`, `owner_add`, `compare_add`, `review_submit`, `api_fetch`
  - Enforced with Postgres enum (`popularity_event_type`).
  - Events are never deleted; truth tables (wishlists/ownerships/reviews) remain the authoritative current state.

- **Event quality and dedupe**
  - Views: UA denylist, per‑visitor (cookie `visitorId`, 3‑day TTL) per‑gear per‑UTC‑day dedupe; anonymous allowed.
  - Wishlists/Ownerships: per‑user per‑gear per‑UTC‑day dedupe for the popularity event (truth tables already unique by user+gear).
  - Useful dev logs emitted for blocked reasons.

- **Storage layout (Drizzle schema)**
  - `app.popularity_events`: raw events (short-lived; 48h retention).
  - `app.gear_popularity_intraday`: UTC-day live counters reused by the live overlay and truncated after each rollup.
  - `app.gear_popularity_daily`: per-gear daily pivoted counts (idempotent upsert).
  - `app.gear_popularity_windows`: rolling snapshots (rows per `7d`/`30d`, `as_of_date` at D‑1).
  - `app.gear_popularity_lifetime`: cumulative monotonic totals by gear.
  - `app.rollup_runs`: persisted rollup run history (timestamps, counts, durations, status, error).
  - `app.compare_pair_counts`: minimal per‑pair counter.
    - Composite primary key: `(gear_a_id, gear_b_id)` with canonical ascending order by id.
    - Denormalized `pair_key` stores the current sorted slugs (`slugA|slugB`) for convenience; updated on increment.
    - Atomic upsert increments `count`.

- **Rollups (UTC, nightly)**
  - Orchestrator: `runDailyPopularityRollup(date?)` in `src/server/popularity/rollup.ts`.
  - Strategy (robust 48h):
    1. Recompute D‑2 daily (late‑arrivals correction)
    2. Recompute D‑1 daily (freshness)
    3. Recompute windows as‑of D‑1
    4. Recompute lifetime totals
    5. Purge only D‑2 raw events
    6. Truncate `gear_popularity_intraday` rows older than the current UTC day and revalidate `trending-live`.
  - Observability: Discord webhook with counts/durations; `rollup_runs` row persisted per run; Admin page lists recent runs.
  - Scheduling: Vercel Cron → `POST /api/admin/popularity/rollup` (`Authorization: Bearer CRON_SECRET`).

- **Caching & revalidation**
  - Trending API and UI cache ~12h; revalidated proactively after rollup via `revalidateTag('trending')`.
  - Live overlay snapshot caches ~2 minutes via `unstable_cache` tagged `trending-live`; invalidated nightly when intraday rows are cleared.
  - Gear stats endpoint caches ~1h with tags (`popularity`, `gear-stats:{slug}`).
  - Pair counts are direct reads from `compare_pair_counts` and do not participate in nightly rollups.

## API Surface

- `GET /api/gear/[slug]/stats`
  - Returns: `{ lifetimeViews, views30d, wishlistTotal, ownershipTotal }`.
  - Backed by `gear_popularity_lifetime`, `gear_popularity_windows` with daily fallback, and truth tables.

- `GET /api/popularity/trending`
  - Query params:
    - `timeframe`: `7d` | `30d` (default `30d`)
    - `limit`: number (default 20, max 100)
    - `brandId?`, `mountId?`, `gearType?` (`CAMERA`|`LENS`) filters
    - `liveOverlay`: optional boolean; when true, the response adds `liveItems` (same-day boosts) plus `generatedAt`.
  - Returns ordered items with `score` (weighted composite) and raw component stats.
  - Live overlay merges the baseline window score with intraday deltas so gear that surges midday shows up before the nightly rollup.

- Ingestion routes (append‑only):
  - `POST /api/gear/[slug]/visit` → records `view` (anonymous allowed; deduped per visitor/day)
  - `POST /api/gear/[slug]/wishlist` → adds/removes truth row; emits `wishlist_add` event (same‑day dedupe)
  - `POST /api/gear/[slug]/ownership` → adds/removes truth row; emits `owner_add` event (same‑day dedupe)
  - Pair counts (minimal): no public API route; compare page uses a server action `actionIncrementComparePairCount` to upsert+increment per pair with a 30‑minute cookie. Composite PK `(gear_a_id, gear_b_id)` ensures stability across slug changes; `pair_key` is refreshed on each increment.

## Example Usage (JavaScript)

Use `NEXT_PUBLIC_BASE_URL` as the absolute base in server contexts.

```ts
const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

// Fetch trending cameras (30d)
const trendingRes = await fetch(
  `${base}/api/popularity/trending?timeframe=30d&gearType=CAMERA&limit=10`,
  { next: { revalidate: 60 * 60 * 12 } },
);
const { items } = await trendingRes.json();

// Fetch gear stats
const statsRes = await fetch(`${base}/api/gear/nikon-z6-iii/stats`, {
  next: { revalidate: 60 * 60 },
});
const stats = await statsRes.json();

// Record a view (anonymous allowed)
await fetch(`${base}/api/gear/nikon-z6-iii/visit`, { method: "POST" });

// Wishlist add/remove (authenticated)
await fetch(`${base}/api/gear/nikon-z6-iii/wishlist`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ action: "add" }),
});
```

## UI Integrations

- `TrendingList` (unified, server component)
  - File: `src/components/trending-list.tsx`
  - Props: `{ timeframe?, limit?, filters?: { brandId?, mountId?, gearType? }, title?, loading?, rows? }`
  - Fetches via the trending API; caches 12h; renders three‑flame score indicator relative to top item.

- Gear page
  - `GearStatsCard` (server + client)
    - Fetches from `/api/gear/[slug]/stats` (1h cache); optimistic local increments on wishlist/ownership via custom browser events.
  - `GearBadges` (server)
    - Minimal, extendable badges; adds a live “Trending” badge (30d) if found in trending.

- Admin dashboard
  - `Popularity Rollup Runs`: lists recent runs from `app.rollup_runs`.

## Live Overlay

- Purpose: surface intra-day spikes (e.g., breaking news) without waiting for the nightly rollup.
- Data flow:
  - Every deduped popularity event increments `gear_popularity_intraday` via an atomic upsert alongside `popularity_events`.
  - `getLiveTrendingData` (server data helper) mirrors the standard score formula over the current UTC-day rows and caches for ~120 seconds (`trending-live` tag).
  - Service layer merges baseline window items with live boosts and can emit telemetry/log messages containing the top movers.
- Lifecycle:
  - Rollup truncates the intraday table after finishing window calculations and revalidates `trending-live`.
  - Admin/Discord notifications summarize the top live movers so operators can confirm the overlay is healthy.
- Consumers opt in by requesting `liveOverlay=true` on the trending API; UI components then render badges/labels such as “🔥 Live today.”

## Rollup Flow (Detailed)

From the revised plan:

1. Ingest → write user actions to `popularity_events` in real time.
2. Nightly rollup (for “yesterday”):
   - Daily → aggregate `popularity_events` → `gear_popularity_daily` (pivoted counts; upsert).
   - Windows → compute 7d and 30d sums from `gear_popularity_daily` → upsert `gear_popularity_windows` with `as_of_date = D‑1`.
   - Lifetime → recompute `gear_popularity_lifetime` (monotonic adds).
   - Leaderboards → `trending` comes from windows; cached.
3. Purge → delete only `D‑2` from `popularity_events` (keep 48h buffer).

## Important Notes

- Canonical timezone for bucketing is UTC; rollups and dedupe are UTC‑day based.
- Popularity events are append‑only. Truth tables provide current counts; derived tables provide historical and aggregated views.
- Dedupe rules:
  - Views: per visitor (cookie `visitorId`) per gear per UTC day; UA denylist blocks bots/crawlers.
  - Wishlist/Ownership: popularity event deduped per user per gear per UTC day; truth tables still enforce uniqueness.
- Caching: trending 12h (`trending` tag) + live overlay 2m (`trending-live` tag) + stats 1h.
- Security: Vercel Cron signed with `CRON_SECRET` using `Authorization: Bearer` header.
- Logging: endpoints and rollup emit concise console logs indicating skipped/blocked reasons (useful in dev).
- Env base URL: use `NEXT_PUBLIC_BASE_URL` (not `NEXT_PUBLIC_SITE_URL`).

## Future / Reach Goals

- Segmented leaderboards UI across brand/mount/type using `TrendingList`.
- Expanded hygiene: IP rate limiting, preview‑bot allowlist.
- Advanced scoring & A/B tests; momentum signals.
- Denormalization for faster filtered queries if profiling shows need.
- Charts and top‑mover analytics in Admin.
- Seed/QA scripts for D‑1/D‑2 events and rollup validation.
- Optional advisory lock or Background Function if rollup duration grows.

---

The system prioritizes correctness (“truth‑first”), idempotent rollups, and cache‑friendly reads. UI integrations consume the stable APIs and refresh automatically when rollups complete.
