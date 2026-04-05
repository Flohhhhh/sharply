# Playwright E2E CI

Workflow file: [/Users/camerongustavson/CodeProjects/sharply/.github/workflows/playwright.yml](/Users/camerongustavson/CodeProjects/sharply/.github/workflows/playwright.yml)

## Purpose

Runs the Playwright end-to-end suite on pull requests targeting `main` or `development`.

## What it does

1. Checks out the repo
2. Installs Node from `.nvmrc`
3. Installs dependencies and Playwright Chromium
4. Creates an ephemeral Neon branch for the PR run
5. Waits for that Neon branch to become ready
6. Resolves a branch-specific `DATABASE_URL`
7. Runs `npm run db:push`
8. Runs `npm run test:e2e`
9. Deletes the Neon branch
10. Uploads Playwright artifacts

## Required GitHub configuration

Secrets:

- `NEON_API_KEY`
- `AUTH_SECRET`
- `PAYLOAD_SECRET`

Variables:

- `NEON_PROJECT_ID`
- optional `NEON_PARENT_BRANCH`
- optional `NEON_DATABASE_NAME`
- optional `NEON_ROLE_NAME`

## Runtime choices

- CI uses Chromium only by default.
- CI uses `PLAYWRIGHT_WORKERS=2` for light parallelism.
- The self-contained server path uses `npm run dev:e2e`.
- Authenticated tests use the Better Auth dev bypass with `DEV_AUTH=true`.

## Notes

- The e2e runner intentionally avoids Turbopack because it was less stable for long Playwright runs.
- The suite uses disposable Neon branches so `db:push` is safe in CI.
