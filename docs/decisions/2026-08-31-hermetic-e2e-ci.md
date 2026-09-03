# Hermetic E2E CI

- **Date:** 2026-08-31
- **Status:** Accepted
- **Related:** PR #391; `docs/e2e-testing.md`

## Context

Sharply had an existing Playwright suite that did not run in CI. Testing against Vercel previews would couple the suite to deploy timing and require an authentication bypass on a public URL. The Neon preview database is production-derived, changes over time, and must not be seeded. Payload and Drizzle also own separate parts of the database schema, so a fresh test database needs both initialization paths.

## Decision

Run Playwright in GitHub Actions against a disposable PostgreSQL service container. Initialize `pg_trgm`, push the Drizzle schema, bootstrap Payload's schema and minimal content, seed deterministic application data, and then build and test the production application.

Pull requests run the Chromium project. Scheduled and manually dispatched runs exercise the full browser matrix. The workflow uses no production credentials or paid external services. The local `npm run e2e:setup-local` command mirrors the CI database setup.

## Alternatives considered

- **Vercel preview deployments:** rejected because they couple tests to deployment timing and would expose the development authentication bypass beyond localhost.
- **Neon branch-per-run:** rejected because it introduces external credentials, cost, and dependency on production-derived infrastructure.
- **The shared preview database:** rejected because it is not deterministic and project policy prohibits seeding it.

## Consequences

- E2E runs are isolated, deterministic, and safe for forked pull requests.
- CI must maintain explicit setup for both Drizzle and Payload schemas.
- Production builds make the PR check slower, so browser and build caches are maintained.
- Specs must not depend on execution order or mutable global aggregates, even though CI currently uses one worker.

Current commands, environment requirements, debugging steps, and test-authoring rules are maintained in `docs/e2e-testing.md`.
