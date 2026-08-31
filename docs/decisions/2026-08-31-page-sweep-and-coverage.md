# Page sweep and coverage reporting

- **Date:** 2026-08-31
- **Status:** Accepted
- **Related:** PRs #394 #395 #396; `docs/e2e-testing.md`

## Context

Sharply's Playwright suite proved the app builds and boots (`docs/decisions/2026-08-31-hermetic-e2e-ci.md`), but no check caught a page that renders an error, an empty state, or a stale query the moment it touches the database. Unit tests cover isolated logic but not the routing -> service -> data path end to end, and unit coverage had no visibility at all — some `src/server/` domains sat at 0% with nothing flagging it.

## Decision

Add a reads-only Playwright "page sweep" as the DB-confidence tier, plus reporting-only Vitest coverage.

- A single manifest (`tests/playwright/utils/route-manifest.ts`) is the source of truth for every route: each entry names its path, filesystem pattern, and a data-driven render marker. `tests/unit/route-sweep-parity.test.ts` diffs the manifest against `src/app` on every run, so a new page must join the manifest or the skip list with a reason.
- Each visit asserts three signals: the marker is visible (primary — proves data reached the page), no error boundary rendered (a late streamed error still fails the test), and the response was OK (secondary — streaming SSR can send 200 before a late error boundary paints). Browser-side third-party requests are blocked so CI's dummy keys can't cause flakes.
- Auth uses a single seeded identity: `dev@sharply.local`, seeded SUPERADMIN, signed in once via `/api/dev-login` in a Playwright `setup` project and reused as one storage state across specs. A gated `email` query param on dev-login would let a future sweep assert role-scoped views without duplicating the identity — documented as the upgrade path, not built.
- Vitest coverage (`npm run test:coverage`) reports on every PR with no thresholds — a ratchet was deliberately deferred while the suite composition is still moving.

## Alternatives considered

- **A dedicated DB-integration test tier** (e.g. hitting service functions directly against a seeded DB, bypassing HTTP): rejected as heavier infrastructure for the same confidence the page sweep already gets by driving the app through real routes.
- **Mutation-level e2e** (create/edit/delete flows through the UI): rejected for the PR-blocking suite to keep it fast and reads-only; mutations remain covered by unit tests on service/action code.
- **Coverage thresholds enforced in CI immediately:** rejected until the baseline stabilizes; a ratchet can follow once real domains are covered instead of ratcheting a moving target.

## Consequences

- The sweep grows mechanically: every new page route is a manifest or skip-list decision, not an optional afterthought.
- E2E stays reads-only, so any regression in a mutation must be caught by unit tests, not the sweep.
- Fixture values (`scripts/e2e/seed-fixtures.ts`) and manifest markers are coupled — changing one without the other breaks or silently weakens a test.
- The e2e check (`e2e-tests`) stays advisory until a green streak accumulates, then flips to required per the PR #391 rollout plan.
