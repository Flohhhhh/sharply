# Deterministic ISR With Live Trending

- **Date:** 2026-08-26
- **Status:** Accepted
- **Related:** `docs/popularity-tracking-system.md`, `docs/date-formatting.md`, `docs/gear-browse-routing.md`

## Context

Cached pages were regenerating with time-dependent output and live trending state even when durable source data had not changed. This caused unnecessary ISR writes and broader cache churn. Sharply still needs relative timestamps and live-ranked Trending experiences without turning cached page output into a frequently changing snapshot.

## Decision

- Render deterministic localized absolute dates in cached HTML using an accessible `<time dateTime="…">` element, then replace only the displayed text with relative wording after hydration. The relative-time component performs no fetch and starts no timer.
- Server-render shared gear badges from stable window rankings. After hydration, batch a small live-status request for visible badges and update them only when live ranking differs.
- Keep the dedicated Trending page, Home trending list, and browse trending strip server-rendered with live-boosted rankings.
- Let the two-minute `trending-live` cache expire naturally instead of invalidating it nightly. Successful rollups continue to invalidate the stable `trending` baseline.
- Keep live score calculation and caching unchanged while omitting the unused `generatedAt` value from the live snapshot.

## Alternatives considered

- **Render relative time directly into cached HTML:** rejected because the output changes with wall-clock time even when source data does not.
- **Render every badge from live rankings on the server:** rejected because it spreads short-lived ranking state into otherwise stable cached pages.
- **Remove live ranking from all server-rendered experiences:** rejected because Trending surfaces are expected to reflect live boosts.

## Consequences

- Cached page output is deterministic for unchanged durable data.
- Relative wording appears after hydration while preserving an accessible absolute timestamp.
- Shared cards use stable rankings initially and may update after one batched client request.
- Primary Trending surfaces retain server-rendered live rankings.
- No schema, migration, translation-key, navigation, SEO-contract, or client-side gear-data-fetch change is required.
