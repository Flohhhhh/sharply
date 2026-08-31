# E2E CI Design — Enforcing the Playwright Suite on Every PR

- **Date:** 2026-08-31
- **Status:** Approved design, pending implementation plan
- **Scope:** Phase 1 of the e2e build-out — run the existing Playwright suite in GitHub Actions on every PR, hermetically and at zero cost. Coverage expansion (auth flows, search, gear detail, compare, …) is a deliberate follow-up phase with its own design.

## Context

A testing audit (2026-08-30) found: a strong vitest unit layer (223 files / 1,091 tests, enforced in CI), a real Playwright suite (10 spec files, ~39 tests) that never runs in CI, and no integration tier. The biggest gap is enforcement: the e2e suite exists, is multi-browser-ready, and protects nothing.

**Standing constraint:** minimize cost. The design must add zero Vercel build minutes and zero paid external services.

## Decision summary

Run e2e hermetically on GitHub-hosted runners: a Postgres service container, deterministic seeding, a production build of the app on the runner, Playwright chromium-only on PRs with the full browser matrix relegated to a nightly scheduled run. Land the check as advisory, stabilize, then flip to required.

**Cost: $0 at any volume.** The repo is public (`Flohhhhh/sharply`), so GitHub Actions standard runners and artifact storage are free. Nothing touches Vercel, Neon, or any paid service; the workflow holds no secrets at all. Vercel deploy behavior is untouched: no new deployments are triggered and preview builds run exactly as they do today.

### Rejected alternatives

- **Test against Vercel preview deployments** — would require enabling the `DEV_AUTH` bypass on a publicly reachable URL (`DEV_AUTH_LOCALHOST_ONLY` defaults to `true` precisely to prevent this), and the preview DB is production-derived and unseedable (AGENTS.md: "never seed the preview database"). Also couples CI to Vercel deploy timing.
- **Neon branch-per-run** — the only option that costs actual dollars (branch compute/storage), needs API secrets in CI, and makes tests depend on drifting production-shaped data.

## Verified facts the design rests on

Each of these was checked in-repo during design, not assumed:

| Fact | Evidence |
|---|---|
| Repo is public → Actions minutes free | `gh repo view` → `"visibility": "PUBLIC"` |
| Playwright config expands to 4 browser projects whenever `CI=true` | `config/playwright.config.ts:7-8` |
| Setting `PLAYWRIGHT_BASE_URL` disables Playwright's managed web server | `config/playwright.config.ts:9` (`shouldManageServer`) |
| The landing page queries Payload at render time | `src/app/[locale]/(pages)/page.tsx` → `getNewsPosts`, `getReviews` |
| Payload has **no migrations** in the repo; its tables exist only via dev-mode auto-push | `find` for Payload migration files → none |
| `src/lib/generated` is **not committed**; seed imports it | `git ls-files src/lib/generated` → empty; `scripts/seed.ts` imports |
| Fresh DBs lack `pg_trgm`; search fails **silently** without it | `schema.ts:24` exports the statement but nothing executes it; suggest route swallows the error |
| `TrendingList` renders `null` with no popularity data | `src/components/trending-list.tsx:77` |
| Seed populates no popularity tables | `scripts/seed.ts` imports (no popularity tables) |
| News and Review collections require a Media upload | `src/collections/News.ts` / `Review.ts` (`type: "upload", required: true`) |
| Blob storage is disabled without a token (local-disk fallback) | `src/payload.config.ts:71` (`enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN)`) |
| `/api/dev-login` self-provisions its user (`dev@sharply.local`) | `src/server/auth/dev-auth/service.ts` + `createDevelopmentUserData` |
| The contact spec mocks `/api/contact`; no Resend key needed | `tests/playwright/contact.spec.ts` (`page.route`) |
| The news-card spec requires ≥1 published news post | `home-news-card-pending-navigation.spec.ts` (`expect(firstNewsCard).toBeVisible()`) |
| Scheduled workflows run from the default branch (`main`); integration happens on `development` | `git remote show origin`; memory: PRs target `development`, `main` moves via promotion PRs |
| `drizzle.config.ts` reads `env.DATABASE_URL` | `config/drizzle.config.ts:9` |

## 1. CI workflow anatomy

A new `.github/workflows/e2e-tests.yml`, mirroring `unit-tests.yml` conventions.

**Triggers:** `pull_request` + `merge_group` against `development` and `main` (chromium only); `schedule` + `workflow_dispatch` for the full 4-browser matrix. One workflow file, matrix gated by env conditional.

**Job steps, in order:**

1. Checkout + `setup-node` from `.nvmrc` (Node 24) with npm cache.
2. `npm ci`.
3. Playwright browser cache (`~/.cache/ms-playwright`, keyed on OS + Playwright version from the lockfile). PR runs install only chromium (`npx playwright install chromium --with-deps`); matrix runs install all engines.
4. **Next.js build cache** (`.next/cache`, keyed on lockfile + source-file hashes with graceful `restore-keys`) — the build step is the largest chunk of the run (~3–4 min cold); a warm webpack cache roughly halves it.
5. Postgres 17 service container (`postgres:17-alpine`, `pg_isready` health check, port 5432).
6. `psql -c "CREATE EXTENSION IF NOT EXISTS pg_trgm"` — before schema push (see §2).
7. `npm run constants:generate` — seed and app import the uncommitted `src/lib/generated`.
8. `drizzle-kit push --force` — `--force` is mandatory; interactive prompts hang headless runners.
9. `npm run e2e:bootstrap` — Payload schema push + Payload content fixtures (see §2, §3).
10. `npm run db:seed` — Drizzle data, extended with popularity rollups (see §2).
11. **Build after seed, never before:** `SKIP_ENV_VALIDATION=1 next build --webpack` with `DATABASE_URL` pointing at the seeded container — ISR/SSG pages execute real DB and Payload queries at build time. The build is its own step, not hidden inside Playwright's `webServer` (120s timeout, confusing failure mode).
12. Run Playwright with `PLAYWRIGHT_SERVER_COMMAND="npm run start:e2e"` so the existing `webServer` block manages server lifecycle exactly as it does locally.
13. Flake tripwire: read the JSON report; emit a warning annotation when any test passed on retry (see §4).
14. Upload the HTML report as an artifact **only on failure**, 7-day retention.

**Env (job-level; no real secrets — fork PRs run safely):**
`DATABASE_URL=postgres://postgres:postgres@localhost:5432/sharply_e2e`; `PAYLOAD_SECRET` = dummy string; `NEXT_PUBLIC_BASE_URL=http://localhost:3000` (build-time-inlined, required per AGENTS.md); `SKIP_ENV_VALIDATION=1`; `DEV_AUTH=true`; `DEV_AUTH_PREVIEW=true`.

**Guardrails:** `timeout-minutes: 20` for PR/merge-group runs, `45` for scheduled/dispatch matrix runs (four projects share one `workers: 1` invocation ≈ 4x test time); same `concurrency` + `cancel-in-progress` pattern as existing workflows (also absorbs CodeRabbit fixup-commit churn).

**Workers:** stays `1` on CI. All specs share one seeded DB and a few write state; serial execution is the safe start. The revisit, if needed, is 2 workers after auditing specs for shared-state writes — not a blind bump.

**PR critical path:** e2e runs as its own job, parallel to `lint` and `unit-tests`, so total PR feedback time equals the e2e duration — that is the number to protect. Expected wall-clock ≈ 10–14 min cold, ≈ 7–10 min with warm npm/browser/build caches. If it creeps past ~15 min warm, the levers in order: audit slowest specs (`--reporter` timing data is in the JSON output), then the 2-worker revisit.

## 2. Database & seed strategy

**Container:** `postgres:17-alpine` (matches Neon's current major), throwaway credential, DB dies with the runner.

**Extension before anything:** `CREATE EXTENSION IF NOT EXISTS pg_trgm` right after the health check. Without it, search is silently broken (the suggest route swallows the error) — search e2e coverage would pass or fail meaninglessly.

**Two schema owners, two steps:**

1. **Drizzle:** `drizzle-kit push --force` from `schema.ts`. Push, not the migration chain: `schema.ts` is the source of truth for tests, push is immune to chain drift, and `protect-migrations.yml` already guards chain integrity separately.
2. **Payload:** no migrations exist; tables only materialize via dev-mode auto-push. `scripts/e2e/bootstrap-payload.ts` (run `NODE_ENV=development` via tsx) initializes the Payload Local API, triggering that push, before the production build. Drizzle/Payload table coexistence in one database is proven daily by local dev and production.

**Two content seeds, matching the two owners:**

- `db:seed` for Drizzle data — **extended to insert deterministic popularity rollups** for a handful of seeded gear items, without which `TrendingList` renders `null` and the home trending spec fails. Extending the main seed (not an e2e-only shim) also fixes fresh local setups.
- The bootstrap script seeds minimal Payload content via the Local API, in dependency order: a Media doc from a committed fixture image in `tests/fixtures/` (News's `image` field is `required: true`), then ≥1 **published** news post referencing it. With no blob token, uploads land on local disk — free, hermetic. The script is find-or-create idempotent (CI never needs that; the local dry-run loop does). A Payload review is added only if the dry run shows the home page needs one — no current spec asserts review cards.

**Pipeline order:** health check → `pg_trgm` → `constants:generate` → `db:push --force` → `bootstrap-payload` → `db:seed` → `next build` → Playwright.

**Data guarantees the seeds must provide** (what existing specs assert): ≥1 published news post; ≥1 trending gear row; ≥1 brand link on `/browse`; a populated gear list.

**De-risking:** before the workflow file is written, run `npm run e2e:setup-local` (§3) plus the full suite against the disposable local Postgres it creates. Data gaps surface in fast local iteration, not 10-minute CI round-trips.

**Auth:** no seeded users — `/api/dev-login` self-provisions; specs authenticate exactly as `routing-auth.spec.ts` already does. Its Discord signup notification no-ops with the webhook env unset.

**Isolation rules for spec authors** (goes in the runbook; matters more as coverage grows):
- Cross-run: guaranteed clean — the DB dies with the runner.
- Within-run: one worker runs files serially in no guaranteed order. Specs may write, but must never assert global aggregates ("exactly 12 gear items") or assume another spec hasn't run. Assert on what you created or what the seed deterministically contains.

**Cost: $0, structurally capped.** No external database, no Neon credentials anywhere in CI — the "never seed the preview DB" rule is enforced by impossibility, not discipline.

## 3. Config & script seams

**`config/playwright.config.ts` — two changes only:**

1. Matrix gate: `runFullBrowserMatrix` becomes `process.env.PLAYWRIGHT_ALL_PROJECTS === "true"` (dropping `CI === "true"`, which is always true in Actions and would 4x every PR run against uninstalled browsers). Local behavior untouched; `test:e2e:all` already sets the var.
2. CI reporter: `[["html"], ["json", { outputFile: "test-results/results.json" }], ["github"]]` — the JSON output feeds the flake tripwire (§4); the `github` reporter annotates failed tests inline on the PR diff, so failures are readable without opening a single log.

Everything else stays: `retries: 2` on CI, `workers: 1`, `forbidOnly`, trace/screenshot settings.

**`package.json` — three new scripts** (inline-env style, matching `dev:e2e`/`preview:e2e`):

- `"e2e:bootstrap": "NODE_ENV=development tsx scripts/e2e/bootstrap-payload.ts"`
- `"start:e2e": "DEV_AUTH=true DEV_AUTH_PREVIEW=true SKIP_ENV_VALIDATION=1 next start -p 3000"` — deliberately no `-H 127.0.0.1`; default binding sidesteps localhost-resolution mismatch on runners.
- `"e2e:setup-local": "bash scripts/e2e/setup-local.sh"` — the one-command local mirror of CI: starts a disposable Docker Postgres (on a non-default port so it never clashes with the dev database), creates `pg_trgm`, and runs the full pipeline (`constants:generate` → `db:push --force` → `e2e:bootstrap` → `db:seed`), leaving the developer one `npm run test:e2e` away from a CI-identical run. This script **is** the Phase-0 dry run, and it permanently fixes the fresh-local-setup traps (silent search, empty trending, missing Payload tables).

**Maintainer trap, documented:** `PLAYWRIGHT_BASE_URL` must stay **unset** in CI — setting it flips `shouldManageServer` to false and Playwright waits forever for a server nobody started.

**New files:** `scripts/e2e/bootstrap-payload.ts`; `scripts/e2e/setup-local.sh`; `tests/fixtures/` (image asset); `.github/workflows/e2e-tests.yml`.

**`scripts/seed.ts` extension:** the popularity-rollup block (§2).

**Docs (AGENTS.md demands no drift):** new `docs/e2e-testing.md` runbook — pipeline overview, `e2e:setup-local` usage, spec-author isolation rules, nightly/matrix story, and debugging pointers (`npx playwright show-report` on a downloaded artifact, `show-trace` for retained traces). README/database docs gain the `pg_trgm` step for fresh local setups. AGENTS.md's testing section points to the runbook.

**What does not change:** `dev:e2e`/`preview:e2e`, every existing spec, anything Vercel-related (zero deploy-pipeline impact), and no new dependencies.

## 4. Rollout policy & operations

**Phase 0 — local dry run.** The §2 pipeline + full suite against fresh Docker Postgres, locally, before the workflow file lands.

**Phase 1 — advisory, with an owner.** The workflow merges as a non-required check via a PR to `development`. Red runs get triaged same-day (by Kevin, or whoever's PR turned it red) — every failure is either a real bug (the check paid for itself) or a data/infra gap (fix the pipeline). Hold for ~a week or ~10 consecutive green runs on real PRs, whichever comes later. An advisory check nobody triages trains everyone to ignore it.

**Phase 2 — required.** Add `e2e-tests` to branch-protection required checks for `development` and `main` (repo settings or `gh api`). On `main` it guards promotion PRs; `merge_group` slots it into the merge queue like `unit-tests`. Standard public-repo friction, unchanged: first-time contributors' workflow runs await maintainer approval.

**No path filtering, deliberately.** Skipped required checks block PRs forever on GitHub (the workaround is a no-op sibling job — complexity for zero savings on a free-minutes repo). Run on every PR.

**Nightly matrix — against the integration branch, explicitly.** Cron at an off-peak, non-top-of-hour time (e.g. `17 9 * * *`) + `workflow_dispatch`, with `PLAYWRIGHT_ALL_PROJECTS=true`, `timeout-minutes: 45`. Scheduled workflows execute from the default branch (`main`), so the job pins its checkout to `ref: development` — otherwise nightly matrix-tests stale code. Failures surface via Actions and scheduled-failure emails; a Discord webhook is a cheap follow-up if those get missed. GitHub pauses schedules after 60 days of repo inactivity — `workflow_dispatch` is the fallback. If nightly brushes the 45-minute cap: it's a diagnostic, not a gate — bump the cap, don't split the job.

**Flake discipline — including the invisible kind.** Retries make *passing* flakes invisible (fail-then-pass shows green, uploads nothing). The JSON-report tripwire (§1 step 12) emits a warning annotation whenever a test passed on retry. Policy: two flakes in a week ⇒ quarantine immediately (`test.fixme` + an issue). A jittery check people override is worse than no check.

**Cost posture.** $0 today at any volume. If the repo ever goes private: ~10–14 min/PR run against 2,000 free monthly minutes ≈ ~150 PR runs before a bill; first levers are dropping the nightly matrix and tightening triggers.

## Out of scope

- E2E coverage expansion (auth flows, search, gear detail, compare, uploads, i18n rendering) — the agreed follow-up phase, its own design.
- An integration test tier (PGlite/testcontainers for Drizzle services) — separately recommended in the audit, separately scoped.
- Discord notifications for nightly failures — cheap follow-up if Actions emails prove insufficient.
