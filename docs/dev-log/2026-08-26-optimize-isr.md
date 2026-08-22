# ISR Trending and Relative-Time Optimization

## Why

Cached pages were regenerating with time-dependent output and live trending state even when durable source data had not changed. This could create unnecessary ISR writes and broaden cache churn. The goal was to make cached output deterministic while preserving live-ranked Trending experiences and existing UX.

## What changed

- Removed the unused `generatedAt` timestamp from the internal two-minute live trending snapshot. Live score calculation and caching are unchanged.
- Added a reusable client relative-time component. Cached HTML now contains a deterministic localized absolute date in an accessible `<time dateTime="…">`; after hydration, only the text changes to the existing relative wording. It performs no fetch and starts no timer.
- Updated gear “last updated” and Home activity timestamps to use the new component.
- Removed the nightly `trending-live` invalidation. That cache expires naturally after two minutes; successful rollups still invalidate the stable `trending` baseline.
- Changed shared badge helpers to server-render from stable window rankings. Once hydrated, visible gear badges batch a small live-status request and update only when live ranking differs.
- Kept the dedicated Trending page, Home trending list, and browse trending strip server-rendered with live-boosted rankings.

## Touched areas

- Popularity types, data access, ranking service, and rollup invalidation
- Shared gear cards and Trending badge components
- Gear detail and Home activity date rendering
- Browse and brand badge-query plumbing
- Internal `/api/trending/status` endpoint
- Popularity, date-formatting, browse-routing documentation, and focused unit tests

No schema, migration, translation key, navigation, SEO contract, or client-side gear-data fetch was introduced.

## Validation

- 56 targeted Vitest tests passed
- Scoped ESLint passed
- Full TypeScript typecheck passed
- React Doctor reported no issues
- `git diff --check` passed

Production deployment and before/after seven-day Vercel metrics remain a separate follow-up so each change can be measured over a comparable window.
