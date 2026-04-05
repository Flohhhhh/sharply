# Unit Test CI

Workflow file: [/Users/camerongustavson/CodeProjects/sharply/.github/workflows/unit-tests.yml](/Users/camerongustavson/CodeProjects/sharply/.github/workflows/unit-tests.yml)

## Purpose

Runs the Vitest suite on pull requests.

## What it does

1. Checks out the repo
2. Installs Node from `.nvmrc`
3. Runs `npm ci`
4. Runs `npm run test:unit`

## Local equivalent

- `npm run test:unit`
- `npm test`
- `npm run check`

`npm run check` is the preferred local default because it also includes lint and typecheck.
