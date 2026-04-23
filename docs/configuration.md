# Configuration Layout

This project keeps root-level configuration files to the minimum required by framework and platform conventions.

## Root-level config files

- `next.config.js` (Next.js auto-discovery requires root)
- `tsconfig.json` (TypeScript and editor tooling default project config)
- `prettier.config.js` (shared formatter config referenced by scripts)
- `package.json` (project manifest and script entry points)
- `.env.example` (documented environment variable template)
- `vercel.json` (Vercel project configuration at root)
- `.github/workflows/lint.yml` (GitHub Actions lint check; runs on pull requests and pushes to `development`/`main` so Vercel Deployment Checks can import the `lint` check from branch commit SHAs)
- `.github/workflows/unit-tests.yml` (GitHub Actions unit test check; runs on pull requests and pushes to `development`/`main` so Vercel Deployment Checks can import the `unit-tests` check from branch commit SHAs)

## Consolidated config directory

Tool-specific configuration files that support explicit paths live in `config/`:

- `config/playwright.config.ts`
- `config/vitest.config.ts`
- `config/drizzle.config.ts`

All related scripts in `package.json` use explicit `--config` paths so config resolution is deterministic in local development and CI.
