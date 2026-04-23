# Configuration Layout

This project keeps root-level configuration files to the minimum required by framework and platform conventions.

## Root-level config files

- `next.config.js` (Next.js auto-discovery requires root)
- `tsconfig.json` (TypeScript and editor tooling default project config)
- `prettier.config.js` (shared formatter config referenced by scripts)
- `package.json` (project manifest and script entry points)
- `.env.example` (documented environment variable template)
- `vercel.json` (Vercel project configuration at root)
- `.github/workflows/lint.yml` (GitHub Actions lint check for pushes to `main`, plus pull requests and merge queue runs targeting `development`)
- `.github/workflows/unit-tests.yml` (GitHub Actions unit test check for pushes to `main`, plus pull requests and merge queue runs targeting `development`)

## Consolidated config directory

Tool-specific configuration files that support explicit paths live in `config/`:

- `config/playwright.config.ts`
- `config/vitest.config.ts`
- `config/drizzle.config.ts`

All related scripts in `package.json` use explicit `--config` paths so config resolution is deterministic in local development and CI.
