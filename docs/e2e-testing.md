# E2E Testing

The Playwright suite (`tests/playwright/`) runs on every PR via
`.github/workflows/e2e-tests.yml` against a hermetic Postgres service
container — no Neon, no secrets, no Vercel involvement.
Design: `docs/superpowers/specs/2026-08-31-e2e-ci-design.md`.

## Local setup (one command)

```bash
npm run e2e:setup-local   # disposable Postgres on :5433 + full pipeline
```

The script prints the two commands for a CI-identical run (production
build + `npm run test:e2e`). For the usual dev-server flow,
`npm run test:e2e` alone still works exactly as before.

## The CI pipeline

health check → `CREATE EXTENSION pg_trgm` → `constants:generate` →
`drizzle-kit push --force` → `e2e:bootstrap` (Payload schema push +
published news fixture) → `db:seed` (includes popularity windows) →
`next build` → Playwright (chromium on PRs; full matrix nightly via
`PLAYWRIGHT_ALL_PROJECTS=true`).

Gotchas encoded in the pipeline — don't reorder it:

- `pg_trgm` must exist before tests or search is silently empty.
- The build must run AFTER seeding: ISR/SSG pages query the DB at build time.
- `PLAYWRIGHT_BASE_URL` must stay unset in CI: setting it disables the
  managed webServer (`config/playwright.config.ts`).
- Some SDK clients are constructed at module scope and throw at import
  without a key (OpenAI, via the creator-videos route) — CI carries dummy
  values for these. Locally, `next build` silently reads your `.env`, so a
  missing dummy only ever surfaces in CI.

## Writing specs — isolation rules

- Cross-run state is guaranteed clean (the DB dies with the runner).
- Within a run, one worker executes spec files serially in no guaranteed
  order. Specs may write to the DB, but must never assert global
  aggregates ("exactly 12 gear items") or assume another spec hasn't
  run. Assert on what you created or what the seed deterministically
  contains.
- Auth: hit `/api/dev-login` (see `tests/playwright/basic/routing-auth.spec.ts`);
  the dev user self-provisions.
- Mock only the outermost third-party boundary with `page.route`
  (pattern: `tests/playwright/contact.spec.ts`); everything inside the
  app runs for real.

## Flakes

CI retries twice and warns (`::warning`) on any test that passed only on
retry. Two flakes in a week ⇒ quarantine it (`test.fixme` + an issue).
A jittery check people override is worse than no check.

## Debugging a red CI run

Download the `playwright-report` artifact from the failed run, then:

```bash
npx playwright show-report path/to/downloaded/playwright-report
```

Traces are retained on first failure — open one with
`npx playwright show-trace <trace.zip>`.

## Known cross-browser debt (phase-2 unskip targets)

The first full-matrix run (2026-08-31) surfaced pre-existing failures in
non-chromium/mobile combos that had never run anywhere. Each is now an
explicit, reasoned skip rather than a red nightly:

- **Pending-navigation specs** (`*-pending-navigation.spec.ts`) run on
  desktop chromium only: they assert a transient loading state whose
  timing races prefetch/soft-navigation on firefox and mobile engines
  (and flaked once even on chromium under the long matrix session — the
  robust fix is delaying prefetch/RSC requests too, not just documents).
- **Desktop-only UI interactions** skip on mobile projects: search
  filter panel (`gear-list-view`), Gear dropdown (`smoke`), decimal
  typing (`number-input`).
- **Mobile locale divergence — possible REAL BUG:** under mobile device
  emulation, the locale middleware misbehaved (a `ja` locale-cookie
  redirect not honored on Mobile Chrome; an `/en/`-prefixed
  `callbackUrl` on Mobile Safari — the default locale should stay
  unprefixed). Both `routing-auth` tests skip on mobile until this is
  investigated app-side. Relevant to the SEO canonicalization work.

Unskipping these — by fixing specs (pending-nav), writing mobile
variants (UI), or fixing the app (locale) — is part of the agreed
coverage phase 2.

## Nightly matrix

A scheduled run executes the full browser matrix (firefox, mobile
Chrome/Safari) against `development`. Trigger manually:
Actions → E2E tests → Run workflow.
