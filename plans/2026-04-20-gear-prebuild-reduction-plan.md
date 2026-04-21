# Gear Prebuild Reduction Plan

## Goal

Reduce build time by stopping full upfront static prebuilding for all gear detail pages, while preserving SEO and cacheability through on-demand ISR plus a small curated prebuild set.

## Target State

- Do not prebuild every gear slug at build time.
- Keep `revalidate = 3600` on gear pages.
- Prebuild only a curated subset of gear pages:
  - trending
  - newest
  - high-traffic
- Let all other gear pages generate on first request and then enter ISR cache.

## Implementation Steps

1. Replace full `generateStaticParams()` in `src/app/[locale]/(pages)/gear/[slug]/page.tsx`.
   Return only a curated list instead of `fetchAllGearSlugs()`.

2. Define curated prebuild sources.
   Add server helpers for:
   - top trending slugs
   - newest release slugs
   - high-traffic slugs

3. Deduplicate and cap the prebuild set.
   Merge the three lists, remove duplicates, and enforce a hard max count.

4. Keep uncached slugs ISR-capable.
   Ensure uncached gear pages can still render on demand and are not forced into 404 behavior.

5. Add a kill switch.
   Support an env flag to disable gear prebuilds entirely for emergency build-time relief.

## Suggested Defaults

- Trending: top 100
- Newest: top 100
- High-traffic: top 200
- Final merged cap: 250 to 300 slugs

## Risks

- First request to a cold gear page will be slower than a fully prebuilt page.
- If the curated set is too small, important SEO pages may not be warmed early enough.
- If high-traffic selection is poor, build-time savings may come with weaker cache hit rates.

## Verification

- `SKIP_ENV_VALIDATION=1 npm run build`
  Confirm build time and generated page count drop meaningfully.

- Production smoke checks:
  - a prebuilt trending gear page
  - a prebuilt newest gear page
  - a non-prebuilt cold gear page

- Confirm:
  - first cold request succeeds
  - subsequent request is cached
  - metadata/canonical behavior remains correct
  - sitemap still lists all indexable gear URLs even if not prebuilt

## Nice-to-Have Follow-Up

- Add simple instrumentation to compare:
  - build duration before/after
  - number of prerendered gear pages
  - first-hit latency for cold ISR gear pages
