# Protect Generated Constants CI

Workflow file: [/Users/camerongustavson/CodeProjects/sharply/.github/workflows/protect-generated.yml](/Users/camerongustavson/CodeProjects/sharply/.github/workflows/protect-generated.yml)

## Purpose

Blocks contributor PRs into `development` when they modify [`src/generated.ts`](/Users/camerongustavson/CodeProjects/sharply/src/generated.ts).

## Why it exists

`src/generated.ts` is generated from the canonical database and should not be regenerated from a contributor's local environment.

## Expected contributor behavior

- Do not edit `src/generated.ts`
- Do not commit locally generated changes to that file
- Revert accidental changes before opening a PR
