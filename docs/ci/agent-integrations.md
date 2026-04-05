# Agent Integrations

This document describes the local CI-related commands agents should prefer when working in Sharply.

## Default command

Run:

```bash
npm run check
```

That covers:

- lint
- typecheck
- unit tests

## When to include e2e

Run:

```bash
CHECK_E2E=true npm run check
```

Use the e2e-inclusive path for:

- Playwright changes
- auth changes
- routing changes
- major server/data-flow changes
- UI changes that affect navigation or end-to-end behavior

Avoid it for:

- copy edits
- isolated type refactors
- small internal changes already covered by unit tests

## Playwright notes for agents

- `npm run test:e2e` is self-contained and starts its own app server.
- The default browser is Chromium.
- Authenticated e2e tests should use the dev bypass through `/api/dev-login`.
- Tests can choose a role with the Playwright auth fixture.

## CI docs map

- [Playwright E2E](/Users/camerongustavson/CodeProjects/sharply/docs/ci/playwright-e2e.md)
- [Unit Tests](/Users/camerongustavson/CodeProjects/sharply/docs/ci/unit-tests.md)
- [Protect Generated Constants](/Users/camerongustavson/CodeProjects/sharply/docs/ci/protect-generated-constants.md)
- [Protect Migrations](/Users/camerongustavson/CodeProjects/sharply/docs/ci/protect-migrations.md)
