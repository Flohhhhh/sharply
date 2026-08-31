# Test Coverage Expansion — Design

**Date:** 2026-08-31
**Status:** Approved design, pending implementation plan
**Goal:** Broad safety-net coverage across the whole app so upcoming changes can't silently break the site.

## Context

Current state at time of writing:

- **Unit:** 226 Vitest files in `tests/unit/`, node environment, run on every PR.
  Eight server domains have zero tests (`brands`, `discord-bot`, `discord-bot-api`,
  `invites`, `leaderboard`, `recommendations`, `validation`, `video-modes`); several
  more are thin (`user-lists`, `metrics`, `contact`). No coverage reporting exists.
- **Integration:** none. No test exercises the `data/` layer against a real Postgres.
- **E2E:** Playwright, ~10 specs (smoke, nav, auth routing, gear list, colorways,
  contact, developer API) against a real Postgres in CI. Advisory check for now
  (PR #391); infrastructure is solid, breadth is small. 67 page routes exist.

## Decisions

| Question | Decision |
| --- | --- |
| Coverage priority | Broad safety net across everything, not targeted depth |
| Integration tier | None. E2E read sweep carries DB confidence; unit stays mocked |
| E2E depth | Reads only, broadly — every major page type; no mutation flows |
| Coverage tooling | Reporting only, no thresholds, no enforcement |
| Work structure | Visibility first (coverage), then e2e breadth, then unit gap-fill |

## Phase 1 — Coverage reporting

Add `@vitest/coverage-v8` (pinned to the same minor as `vitest` 2.1.9 — the
provider is version-coupled) and a `test:coverage` script:
`vitest run --coverage --config=config/vitest.config.ts`.

- **Scope:** `coverage.include` = `src/server/**`, `src/lib/**`, `src/hooks/**` —
  the logic layers. Exclude generated files (`payload-types.ts`, generated
  constants) and declarative config-only modules. Page shells (`src/app/**`),
  shadcn primitives (`src/components/ui/**`), and Payload collections stay out of
  scope so the topline number measures only where unit tests should exist.
- **Untested files must appear:** verify `coverage.all` resolves to true under
  this config so a file no test imports reports **0%** instead of being silently
  absent. Without this the 8 empty domains would vanish from the report.
- **Reporters:** `text-summary` locally; in CI additionally `json-summary` +
  `html`, with the summary appended to the GitHub Actions job summary and the
  HTML report uploaded as a workflow artifact. The per-file map that orders
  Phase 3 is browsable from any CI run.
- **CI wiring:** the unit-tests workflow's test step becomes
  `npm run test:coverage` (running the suite twice to keep coverage "optional"
  would double CI time for nothing). With no thresholds, coverage adds no new
  failure modes — the job fails only on real test failures. Modest runtime
  increase from v8 instrumentation is expected.

**Deliverable:** one small PR to `development`. The first CI run after merge
produces the baseline gap map.

## Phase 2 — E2E read sweep

### Structure

New directory `tests/playwright/pages/`, one spec file per area so failures
localize:

| Spec | Routes |
| --- | --- |
| `core.spec.ts` | home, gear list, gear detail, browse, search, brand, tags |
| `community.spec.ts` | reviews, news, learn (+ basics), lists (trending / hall-of-fame / under-construction), `u/[handle]`, shared list, recommended-lenses (index + detail), invite landing |
| `tools.spec.ts` | compare, exif-viewer, focal-length-reference, focal-simulator, instagram-post-builder |
| `static.spec.ts` | about, privacy, terms, developer + docs, discord pages, auth pages render (signin, verify-otp, welcome), confirmation shells (edit-success, gear submitted) |
| `auth-gated.spec.ts` | profile, settings (+ add-passkey), gear edit, contribute/random |
| `admin.spec.ts` | the 12 `(admin)` route-group pages + the 3 admin recommended-lenses pages |

Skipped: `/cms` (Payload's own UI), `ui-demo`, `construction-test` (dev-only).
Any route not listed here gets triaged by the route-parity guard at
implementation time — into a bucket or onto the skip list with a reason.

### Assertion contract

One shared helper, roughly `expectPageRenders(page, path, { marker })`:

- **Primary signal:** the marker is *visible* — for data-backed pages a seeded
  value (a gear name, not a static heading), proving
  routing → service → data → Postgres ran; for static/legal pages, main content
  plus absence of the error boundary (no data path exists to prove).
- **Status is secondary:** with streaming SSR the 200 is sent before a late
  error boundary renders, so status alone passes on broken pages.
- **Hermeticity:** the helper blocks browser requests to non-localhost hosts
  (`page.route` abort) — CI runs with dummy external keys, and a page flaking on
  an unreachable third-party call must degrade, not fail the sweep. This covers
  only browser-side calls; server-side fetches to external services already run
  against dummy keys in CI today (the existing suite proves the
  degrade-gracefully pattern). Any page that hard-fails server-side without a
  real key is a finding the sweep's first run surfaces — and a real resilience
  bug worth fixing.
- **Locales:** default locale (`en`) only; one dedicated spec asserts a second
  locale renders to guard the i18n plumbing.
- **Failures are specific:** the helper reports *which* signal failed (marker
  missing vs. error boundary present vs. non-OK status) so a red run points at
  the layer that broke. No try/catch-and-continue, no conditional assertions.

### Route manifest + parity guard

The sweep is driven by a single importable **route manifest**
(`tests/playwright/utils/route-manifest.ts`): one entry per covered route —
path, marker, auth requirement, owning spec — plus an explicit skip list with
a reason per entry. Spec files consume the manifest; a unit test (same pattern
as `translation-parity.test.ts`) globs `src/app/**/page.tsx`, normalizes to
route paths, and fails when a route appears in neither the manifest nor the
skip list. One source of truth makes the guard trivial and keeps specs and
coverage from drifting apart. "New page ⇒ new sweep entry" is enforced
mechanically, not by convention.

### Seed fixtures

Dynamic routes need known slugs. `tests/playwright/utils/fixtures.ts` exports
the canonical seeded entities (gear slug, brand, tag, review, news article,
user handle, shared list). Where today's seed lacks an entity type, extend
`scripts/e2e/bootstrap-payload.ts` / the seed — part of this phase, and where
the real effort hides.

### Auth

The dev-login route mints sessions for exactly one identity per server process
(`DEV_AUTH_EMAIL`, resolved at startup) — per-role storage states are not
possible without product changes. Instead: seed the dev user's `users.role`
column to `SUPERADMIN` (verified mechanism: the `(admin)` layout gates via
`requireRole` with a `MODERATOR` minimum; individual pages may gate higher, so
top privilege guarantees every admin page is reachable). One Playwright setup
project hits `/api/dev-login` once and saves a single `storageState`, shared
by `auth-gated.spec.ts` and `admin.spec.ts`. Costs nothing for a read sweep (assertions are minimal, so
admin-only UI on regular pages is harmless). If a future spec needs a non-admin
session, the upgrade path is a gated `email` query param on dev-login — noted,
not built.

### Budget and definition of done

~60 page loads against the pre-built app at CI's single worker ≈ 3–6 min,
inside the 20-minute budget; shard only if reality disagrees. Done = sweep
green and stable, then flip the e2e check from advisory to required (the
PR #391 plan). Lands as 2–3 PRs (helper + fixtures + core first, then the
rest).

## Phase 3 — Unit gap-fill, risk-ordered

### Order

Driven by the Phase 1 coverage map, tie-broken by blast radius and
**e2e-darkness** (code no page render can ever exercise):

1. `validation/dedupe.ts` — pure logic used across domains, no mocks needed;
   the cheapest high-value tests in the repo
2. `discord-bot` + `discord-bot-api` — webhook-facing, signature verification,
   e2e-dark (no page renders them; a regression ships silently)
3. `invites` — auth-adjacent, gates account creation
4. `brands`, `leaderboard`, `recommendations`, `video-modes` — the remaining
   empty domains, all standard `service.ts` + `data.ts` shape
5. Everything the map shows red elsewhere: thin server domains (`user-lists`,
   `metrics`, `contact`), plus `src/lib` and `src/hooks` modules — in coverage
   scope and carrying real logic (EXIF parsing, formatting, client state)

### Style — follow the house pattern, no new infra

Tests live flat in `tests/unit/*.test.ts`, node environment. For
standard-shape domains, `vi.mock` the `data/` boundary and test the **service
layer**: auth/role gating, orchestration branches, error paths. For pure
modules (`validation`, most of `src/lib`), no mocks — direct input/output
tests. The AGENTS.md rule ("significant functional logic only, no
surface-level assertions") is the filter for every test, across layers: thin
`actions.ts` wrappers stay untested, but where an action holds real logic the
repo already tests it (`gear-actions-botid.test.ts` is the precedent). `data/`
files stay unit-untested by design — the accepted trade-off from the
lightweight-integration decision, backstopped by the e2e sweep exercising real
queries. No jsdom, no testing-library.

### Deliverables

One PR per cluster (roughly the numbered groups above), each small enough for
CodeRabbit to review meaningfully. Definition of done: no `src/server/*`
domain at 0% on the coverage report; every empty-domain service function has
its main branches tested; every `src/lib`/`src/hooks` red is either tested or
consciously skipped with a one-line reason.

## Operational policy

- **Flake policy:** CI already retries twice; a spec that needs retries on two
  separate runs gets quarantined immediately (`test.fixme` + tracking issue).
  The advisory→required flip depends on a clean streak — quarantine is a
  same-day action, not a backlog item.
- **Docs (no-drift rule):** `docs/e2e-testing.md` gains the sweep architecture
  (pages/ directory, fixtures module, storageState setup project, marker
  contract). AGENTS.md's testing section gains `test:coverage` and two
  conventions: *new page ⇒ new sweep entry* (enforced by the route-parity
  guard) and *new server module ⇒ unit tests in the same PR*.
- **Sequencing:** roughly seven PRs to `development`, strictly ordered only
  where data dependencies exist: P1 coverage (1 PR) → P2 sweep (2–3 PRs,
  ending with the required-check flip) → P3 unit clusters (~4–5 PRs, order set
  by the P1 map). P3 clusters are independent and can interleave with feature
  work — P1+P2 alone already answer "will my change break the site."
