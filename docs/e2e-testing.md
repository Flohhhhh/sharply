# E2E Testing

The Playwright suite (`tests/playwright/`) runs on every PR via
`.github/workflows/e2e-tests.yml` against a hermetic Postgres service
container — no Neon, no secrets, no Vercel involvement.
Decision record: `docs/decisions/2026-08-31-hermetic-e2e-ci.md`.

## Local setup (one command)

```bash
npm run e2e:setup-local   # disposable Postgres on :5433 + full pipeline
```

The script prints the two commands for a CI-identical run (production
build + `npm run test:e2e`). For the usual dev-server flow,
`npm run test:e2e` alone still works exactly as before.

## Creating a PR (e2e-gated)

```bash
npm run pr:create            # runs the e2e suite, then gh pr create --base development
npm run pr:create -- --fill  # extra args go to gh pr create
```

PR creation is gated on a green suite: if any test fails, `gh pr create`
never runs. The suite uses the managed dev server (`dev:e2e`), so it
needs your dev database up and `DEV_AUTH=true` in `.env` (see above).
CI re-runs the same suite on the PR either way — this gate just saves
the round-trip.

### Pre-push hook (automatic)

A committed `pre-push` hook (`.githooks/pre-push`, wired by the npm
`prepare` script via `git config core.hooksPath .githooks`) enforces the
same gate for people who push first and open PRs in the GitHub UI: the
**first push of a branch** (no open PR yet) runs the e2e suite and
blocks the push if it fails. Pushes to branches with an open PR,
`development`/`main`, tags, and deletions all skip instantly — CI
already covers those. Bypass once with `git push --no-verify`. If `gh`
isn't installed the hook warns and lets the push through rather than
bricking it.

## The CI pipeline

health check → `CREATE EXTENSION pg_trgm` → `drizzle-kit push --force` →
`e2e:bootstrap` (Payload schema push + published news fixture) →
`db:seed` (includes popularity windows) → `next build` → Playwright
(chromium on PRs; full matrix nightly via `PLAYWRIGHT_ALL_PROJECTS=true`).
The committed `src/lib/generated.ts` feeds the seed — do NOT set
`GENERATE_CONSTANTS=true` around this pipeline; the generator would read
the throwaway e2e database and clobber the tracked constants file.

Gotchas encoded in the pipeline — don't reorder it:

- `pg_trgm` must exist before tests or search is silently empty.
- The build must run AFTER seeding: ISR/SSG pages query the DB at build time.
- `PLAYWRIGHT_BASE_URL` must stay unset in CI: setting it disables the
  managed webServer (`config/playwright.config.ts`).
- Some SDK clients are constructed at module scope and throw at import
  without a key (the OpenAI client in `src/lib/open-ai`) — CI carries
  dummy values for these. Locally, `next build` silently reads your
  `.env`, so a missing dummy only ever surfaces in CI.

## Writing specs — isolation rules

- Cross-run state is guaranteed clean (the DB dies with the runner).
- Within a run, one worker executes spec files serially in no guaranteed
  order. Specs may write to the DB, but must never assert global
  aggregates ("exactly 12 gear items") or assume another spec hasn't
  run. Assert on what you created or what the seed deterministically
  contains.
- Auth: hit `/api/dev-login` (see `tests/playwright/basic/routing-auth.spec.ts`);
  the dev user self-provisions. For the default local flow
  (`npm run test:e2e` against `dev:e2e`), the auth specs need
  `DEV_AUTH=true` in your `.env` — CI sets it via `start:e2e`.
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
- **routing-auth mobile failures — RESOLVED, no skips:** the
  locale-cookie flake was a test-side race, root-caused and fixed: the
  middleware re-sets `NEXT_LOCALE` on every response (`src/proxy.ts`),
  so an in-flight prefetch/RSC response could overwrite the
  test-injected `ja` cookie — the spec now leaves the page
  (`about:blank`) to abort in-flight requests before injecting
  (verified 16/16 across chromium + Mobile Chrome). The Mobile Safari
  auth failure was WebKit dropping Secure session cookies over plain
  http — better-auth infers production under `next start` without an
  explicit base URL, so CI sets `BETTER_AUTH_URL=http://localhost:3000`.

Unskipping these — by fixing specs (pending-nav), writing mobile
variants (UI), or fixing the app (locale) — is part of the agreed
coverage phase 2.

## Nightly matrix

A scheduled run executes the full browser matrix (firefox, mobile
Chrome/Safari) against `development`. Trigger manually:
Actions → E2E tests → Run workflow.

Two schedule facts worth knowing: the cron does not fire until the
workflow file reaches `main` (promotion PR), and a scheduled run always
executes `main`'s copy of the workflow — only the checkout is pinned to
`development`. Pipeline changes on `development` therefore apply to
nightlies only after promotion. Flaky-but-green runs upload the
Playwright report artifact too, so quarantine decisions have evidence.
