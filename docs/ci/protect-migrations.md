# Protect Migrations CI

Workflow file: [/Users/camerongustavson/CodeProjects/sharply/.github/workflows/protect-migrations.yml](/Users/camerongustavson/CodeProjects/sharply/.github/workflows/protect-migrations.yml)

## Purpose

Blocks contributor PRs into `development` when they include SQL files under `drizzle/`.

## Why it exists

Sharply contributors test schema changes with `db:push`, but maintainers generate consolidated migrations when changes move from development toward release branches.

## Expected contributor behavior

1. Edit [`src/server/db/schema.ts`](/Users/camerongustavson/CodeProjects/sharply/src/server/db/schema.ts)
2. Test with `npm run db:push`
3. Commit schema changes only
4. Leave migration generation to maintainers
