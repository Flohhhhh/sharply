# Revised plan for popularity tracking

The Sharply popularity system is truth-first and cache-friendly: we ingest a minimal set of append-only events (canonical actions, UTC-bucketed), roll them up nightly into per-gear daily pivots, and derive two clear projections—short-window snapshots (7d/30d) for momentum and monotonic lifetime adds for cumulative history—while current owners/wishlists come from their relationship tables. We keep event columns hard-coded to prevent drift, make rollups idempotent, and purge raw after successful aggregation. Trending is treated as a read-optimized cache: sum the window columns into a transparent score, precompute ordered leaderboards, and serve them from Vercel edge with DB fallbacks; the database remains the source of truth and can always rebuild caches. Filters (brand/mount/type) are handled via joins, with optional denorm only if profiling warrants it. The philosophy is correctness over cleverness, caches over heavy queries, explicit semantics over magic (“lifetime adds” vs “on wishlists now”), and small, stable schemas that scale—plus basic anti-gaming hygiene to keep signals honest.

# Table Structure

- popularity_events — short-lived, append-only raw signals used to build daily numbers, then purged.
  Columns: id, gear_id, user_id?, visitor_id?, event_type (view, wishlist_add, owner_add, compare_add, review_submit, api_fetch), created_at.
  Note: event_type will be enforced by a Postgres enum; views are recorded for all visitors (no auth gating) and user_id may be null. For anonymous visitors we set a cookie-based `visitor_id` for dedupe.

- gear_popularity_daily — per-gear, per-day pivoted counts for fast 7d/30d math.
  Columns: date, gear_id, views, wishlist_adds, owner_adds, compare_adds, review_submits, api_fetches, updated_at.

- gear_popularity_windows — cached snapshots for specific timeframes (rows per timeframe).
  Columns: gear_id, timeframe (7d, 30d), as_of_date, views_sum, wishlist_adds_sum, owner_adds_sum, compare_adds_sum, review_submits_sum, api_fetches_sum, updated_at.
  Note: keep only the latest row per (gear_id, timeframe) unless you want chart history.

- gear_popularity_lifetime (renamed from “totals” to clarify semantics) — authoritative cumulative adds (monotonic) for instant reads.
  Columns: gear_id, views_lifetime, wishlist_lifetime_adds, owner_lifetime_adds, compare_lifetime_adds, review_lifetime_submits, api_fetch_lifetime, last_updated.
  ➤ These are ever-increasing sums derived from gear_popularity_daily. They do not decrease.

- gear_ownerships (rename ownerships)— truth table for current “I own this.”
  Columns: gear_id, user_id (unique pair), created_at.

- gear_wishlists (rename wishlists) — truth table for current wishlists.
  Columns: gear_id, user_id (unique pair), created_at.

## Conventions and decisions

- Naming conventions: use lowercase snake-case event types: view, wishlist_add, owner_add, compare_add, review_submit, api_fetch. We will standardize on these across code and DB once implementation begins.
- Postgres enum: enforce event_type with a dedicated enum (e.g., app.popularity_event_type) for safety and consistency.
- Views from everyone: record view events for all visitors; do not require authentication. Keep user_id nullable for anonymous traffic.
- No points/weights: remove the points system entirely for now. Any “score” used for leaderboards will be a simple sum of window counts; we can revisit weighting later if needed.
- Append-only discipline: never delete popularity events when wishlists/ownerships/reviews are removed. Popularity tables are cumulative; real-time “current” counts must come from the authoritative truth tables (wishlists, ownerships, reviews).
- Implementation status: rollup tables (daily/windows/lifetime) are implemented in schema; ingestion and nightly jobs will wire them up.

# Flow

1. Ingest → write user actions to popularity_events in real time.

2. Nightly rollup (for “yesterday”)

- Daily → aggregate popularity_events → gear_popularity_daily (pivoted counts; upsert).
- Windows → compute 7d and 30d sums from gear_popularity_daily → upsert gear_popularity_windows with as_of_date = yesterday.
- Lifetime → recompute gear_popularity_lifetime (monotonic “lifetime” adds); recompute current owners/wishlists from gear_owners / gear_wishlists where needed.
- Leaderboards (precomputed) → build ordered lists per timeframe (7d/30d) and segment (global + brand + mount + gear_type).
  - We will create a cached API route to generate lists of items "leaderboards" using a simple score from window counts (e.g., views + wishlist_adds + owner_adds + compare_adds + review_submits). No points/weights for now.
    - simplest example of this is a list of the top 20 items (this will be our "trending" items)
    - we also want trending items for each brand, and trending items for each type of gear etc.

1. Purge → delete “yesterday” from popularity_events (optionally keep 1–2 days buffer).

# Features

## Global Popularity

- display top trending items in updating lists (using the leaderboards route handler)
- display most wished items
- display most owned items

## Item Popularity

- display lifetime views on gear page
- display current total owners on gear page
- display current total wishlists on gear page
- display any badges like "trending" etc.
- display recent stats (like 30d or 7d)

## Discovery Popularity

- display trending indicator icon on cards when searching etc.
- sort/filter searches by trending/relevance

## Time Based Popularity Insights

- get a list of recently released items with lots of popularity interest

- Display currently trending items [ fetched by getting top counts from gear_popularity_windows? ]

# Important Notes

- Define canonical timezone for daily bucketing (UTC is safest). Derive date = created_at AT TIME ZONE 'UTC' consistently.
- Allow late arrivals if needed: keep popularity_events for 48h or rerun a “D-1 correction” step before purge. Otherwise, late events won’t hit daily.
- Add relevant indexes
- View quality: exclude obvious bots via UA denylist; dedupe per visitor per gear per UTC day using `user_id` when signed-in or cookie-based `visitor_id` when anonymous.

# Deferred work (future tasks)

- Concurrency safety (advisory lock) if rollup overlap becomes an issue
- Rollup observability table (`app.rollup_runs`) and admin UI for recent runs
- Seed/testing script to create test events and validate rollups locally
