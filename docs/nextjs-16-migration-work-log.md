# Next.js 16 Migration Work Log

This document records the practical work completed during the Sharply Next.js 16 migration, including decisions made during execution, issues that did not go perfectly, and follow-up work that should happen later.

## Scope

The migration goal was to:

- upgrade Sharply from the Next.js 15 stack to Next.js 16
- keep the app behavior stable
- fix upgrade-caused breakage in framework-touching areas only
- finish with passing static checks, unit tests, production build, and targeted e2e coverage

This was intentionally not a broad modernization pass.

## Final versions adopted

- `next@16.2.10`
- `react@19.2.7`
- `react-dom@19.2.7`
- `eslint-config-next@16.2.10`
- `payload@3.74.0`
- `@payloadcms/next@3.74.0`
- related `@payloadcms/*` packages aligned to `3.74.0`

## Why Payload did not land on 3.85.x

The original plan targeted Payload `3.85.2`, but that did not hold in this repo during execution.

Observed issue:

- the newer Payload line exposed a runtime/database compatibility issue in the current Sharply environment
- one concrete failure path involved Payload expecting data/shape behavior that did not match the current database-backed runtime state

Decision made:

- pin the Payload family to `3.74.0`, which remained compatible with Next.js 16 in this repo
- avoid forcing the newer Payload line as part of the Next.js upgrade

Result:

- Next.js 16 migration completed successfully
- Payload remains upgraded from the prior state, but not to the original `3.85.x` target

## What changed

### Framework and config

- upgraded Next.js and React to the Next 16 / React 19.2 stack
- removed deprecated Next build-time ESLint config from `next.config.js`
- kept webpack as the production build path with `next build --webpack`
- updated preview/e2e build scripts to use webpack explicitly
- added `outputFileTracingRoot` in `next.config.js`

### Middleware to proxy

- renamed `src/middleware.ts` to `src/proxy.ts`
- preserved locale rewrite, redirect, and matcher behavior
- updated affected docs and tests to reflect the `proxy` entrypoint name

### Lazy server initialization

To avoid build-time and prerender-time import failures under Next 16:

- database client initialization was made lazy
- auth initialization was made lazy
- Resend email client initialization was made lazy

This reduced import-time side effects and made build workers more reliable.

### Auth fixes

- refactored `src/auth.ts` around lazy `getAuth()`
- preserved the exported `auth` interface through a proxy
- added a `has` trap to the proxy so Better Auth / Next integration checks still behave correctly
- moved auth additional user-field definitions into a shared file for reuse in the client auth setup

### Search client/server boundary cleanup

- moved shared search response/result types into `src/types/search-results.ts`
- updated search UI to import those shared types instead of importing through server code

This was required because Turbopack/client graph resolution was following type imports into server-only modules and dragging server dependencies into browser paths.

### Next 16 API compatibility adjustments

- updated `revalidateTag` usage to pass the second argument required by the newer contract in the touched path

### E2E/test harness adjustments

- Playwright default host moved to `localhost` instead of `127.0.0.1`
- this was needed because the local dev auth bypass is intentionally localhost-scoped by default
- added targeted routing/auth coverage around locale redirects, auth gating, browse navigation, and CMS smoke behavior

### Preview auth override

During migration, a new testability problem appeared:

- the stable runtime path for this repo is currently the built app started with `next start`
- the local `/api/dev-login` bypass is intentionally blocked in production mode
- targeted preview-mode e2e coverage still needed a local auth bypass

Decision made:

- add `DEV_AUTH_PREVIEW=true` as an explicit localhost-only preview/e2e override
- keep normal production behavior closed by default
- only enable the bypass for deliberate local preview/e2e runs

This allowed auth-related Playwright coverage to run against the built app without weakening the ordinary production safety guard.

## What did not go perfectly

### Payload 3.85.x was not viable in this pass

The largest deviation from plan was the inability to keep the repo on the latest intended Payload `3.85.x` line.

This was not cosmetic:

- the upgrade introduced real runtime incompatibility
- resolving it would have widened scope beyond a clean Next.js 16 migration

### Turbopack remained noisier than webpack

Although Next.js 16 strongly improves Turbopack, this repo still showed rough edges in dev-mode and migration verification:

- `/browse` could surface dev-only runtime noise
- some navigation/e2e paths were less stable in Turbopack than in the webpack-backed built app
- client/server graph issues appeared more clearly under Turbopack

Because of that:

- webpack remains the explicit production build path for now
- Turbopack migration was intentionally left out of scope

### Build verification was occasionally affected by Neon connectivity

The app’s build/prerender flow depends on the database and occasionally hit transient infrastructure/network issues during verification:

- intermittent Neon DNS lookup failures
- intermittent connection failures during prerender/build

These were environmental rather than code regressions, but they made verification noisier and sometimes required rerunning the build.

### New ESLint hook/compiler-related rules were too noisy to adopt during the migration

After moving to `eslint-config-next@16`, several React hooks/compiler-adjacent rules became newly active.

In this repo they created broad, migration-unrelated churn, so they were disabled for this pass:

- `react-hooks/immutability`
- `react-hooks/incompatible-library`
- `react-hooks/preserve-manual-memoization`
- `react-hooks/purity`
- `react-hooks/refs`
- `react-hooks/set-state-in-effect`
- `react-hooks/static-components`

That was a migration pragmatism decision, not a statement that these rules should remain ignored forever.

### One auth type path still uses a pragmatic workaround

The profile settings page currently uses a defensive runtime shape check around `listPasskeys()` results instead of a clean library-provided type contract.

This is stable enough for now, but not ideal long-term.

## Validation completed

The migration was closed only after the following passed:

- `npm run check`
- `npm run test`
- `npm run build`
- targeted Playwright coverage for:
  - homepage smoke
  - browse
  - search shell
  - gear detail
  - contact flow
  - locale routing
  - gated auth redirect and dev-login
  - CMS smoke route

## Recommended follow-up work

These items were intentionally deferred and should be evaluated later.

### 1. Revisit Payload 3.85.x compatibility

Do this as a separate task.

Goals:

- identify the exact DB/runtime incompatibility with the newer Payload line
- decide whether the fix belongs in config, schema, seed/runtime assumptions, or a package compatibility jump
- only then move the `@payloadcms/*` family forward again

### 2. Evaluate Turbopack separately

Do not mix this with caching/rendering work.

Goals:

- test `next build --turbopack` explicitly
- compare runtime behavior of `next dev` vs built app for browse/search/CMS/auth flows
- remove the webpack fallback only when Turbopack is stable in this repo

### 3. Adopt Next.js 16 Cache Components deliberately

This is the highest-value user-facing follow-up unlocked by the upgrade.

Best initial candidates:

- homepage sections
- `/browse`
- gear detail routes
- trending/reviews/news sections

The migration itself did not adopt the new Cache Components model.

### 4. Revisit newly disabled React hooks/compiler rules

These should be reviewed later in a dedicated cleanup pass.

Goals:

- determine which rules represent real issues in Sharply
- re-enable rules selectively where practical
- avoid treating the migration-era config as permanent if it does not need to be

### 5. Clean remaining non-blocking warnings

Current known examples:

- `metadataBase` warnings
- Payload Sass import warnings during build
- existing hydration/DOM-structure warnings outside the upgrade-critical path

These were not blockers for the migration, but reducing warning noise will help future upgrades and performance work.

### 6. Simplify passkey typing when upstream types allow it

If Better Auth exposes a cleaner typed contract for `listPasskeys()`, remove the runtime coercion logic and replace it with a direct typed path.

## Recommended next phase

The recommended next phase after this migration is:

1. keep webpack as the stable production build path
2. avoid spending time on Turbopack first
3. move into loading/caching improvements, especially Cache Components
4. return to Turbopack and newer Payload adoption as separate follow-up tracks

## Summary

The migration succeeded, but it was not perfectly linear.

The most important outcomes were:

- Sharply now runs on Next.js 16 successfully
- behavior stayed stable across the main tested user flows
- the build/runtime path is currently stable on webpack
- the newest intended Payload line and full Turbopack adoption were both deferred for valid compatibility reasons

That leaves the repo in a good position for the next meaningful improvement phase: page loading, streaming, and caching work.
