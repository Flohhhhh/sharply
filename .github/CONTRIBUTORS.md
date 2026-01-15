# Contributing to Sharply

Thank you for your interest in contributing to Sharply! This guide covers the essential workflow for contributors.

## Getting Started

1. Fork the repository and create a feature branch from `development`
2. Set up your local environment following the [README.md](../README.md)
3. Make your changes and test locally

## Database Schema Changes

**Important**: Contributors should never generate or commit migration files.

### Workflow

1. **Make schema changes** in `src/server/db/schema.ts`
2. **Test locally**: Use `npm run db:push` to sync your local database with schema changes
3. **Do NOT** run `db:generate` or commit migration files
4. **Commit only** the schema changes (`schema.ts`)
5. **Maintainers** will generate a consolidated migration when merging dev to main/staging
6. **After migrations are merged**: Pull and run `npm run db:migrate` to sync your local database

### First-Time Setup

For new contributors setting up a fresh database:

```bash
npm run db:push  # One-time initial setup
npm run db:seed -- --confirm-seed  # (optional) Populate sample data
```

### During Development

When working on schema changes:

```bash
npm run db:push  # Sync your local database with schema.ts changes (for testing)
```

### After Migrations Are Merged

When maintainers have merged migrations to main:

```bash
npm run db:migrate  # Apply pending migrations to your local database
```

## Pull Requests

- Target the `development` branch
- Include clear descriptions of changes
- Ensure all tests pass (`npm run lint`, `npm run typecheck`, `npm run build`)
- Update relevant documentation in `/docs` if needed

## Code Quality

- Run `npm run lint` and fix any errors
- Run `npm run typecheck` to ensure TypeScript compiles
- Follow the existing code style and patterns

## Questions?

- Review the main [README.md](../README.md) for project structure
- Check `/docs` for architecture details
- Open an issue for questions or reach out to maintainers
