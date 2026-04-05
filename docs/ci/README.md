# CI Overview

Sharply currently uses four GitHub Actions workflows:

- [Playwright E2E](/Users/camerongustavson/CodeProjects/sharply/docs/ci/playwright-e2e.md)
- [Unit Tests](/Users/camerongustavson/CodeProjects/sharply/docs/ci/unit-tests.md)
- [Protect Generated Constants](/Users/camerongustavson/CodeProjects/sharply/docs/ci/protect-generated-constants.md)
- [Protect Migrations](/Users/camerongustavson/CodeProjects/sharply/docs/ci/protect-migrations.md)

Agent-specific guidance lives in:

- [Agent Integrations](/Users/camerongustavson/CodeProjects/sharply/docs/ci/agent-integrations.md)

## Local defaults

- `npm run check` runs lint, typecheck, and unit tests.
- `CHECK_E2E=true npm run check` also runs Playwright.
- Use Playwright only for larger or riskier changes that need real browser validation.
