# Configuration Layout

This project keeps root-level configuration files to the minimum required by framework and platform conventions.

## Root-level config files

- `next.config.js` (Next.js auto-discovery requires root)
- `tsconfig.json` (TypeScript and editor tooling default project config)
- `prettier.config.js` (shared formatter config referenced by scripts)
- `package.json` (project manifest and script entry points)
- `.env.example` (documented environment variable template)
- `vercel.json` (Vercel project configuration at root)
- `.github/workflows/lint.yml` (GitHub Actions lint check for pull requests and merge queue runs targeting `development`/`main`)
- `.github/workflows/unit-tests.yml` (GitHub Actions unit test check for pull requests and merge queue runs targeting `development`/`main`)

## BotID integration

- Sharply uses the Vercel BotID Next.js integration in `next.config.js` via `withBotId(...)`.
- `vercel.json` stays unchanged for BotID because the Next integration injects the required proxy rewrites and headers for this app.
- The current app is on Next.js `15.2.x`, so BotID is mounted with `<BotIdClient protect={...} />` in `src/app/[locale]/layout.tsx`.
- If the project upgrades to Next.js `15.3+`, the preferred BotID client mount becomes `initBotId()` in `instrumentation-client.ts`.
- Protected paths in this rollout:
  - `POST /api/contact`
  - `POST /api/gear/*/reviews`
  - `POST /api/reviews/*`
  - `POST /api/exif-tracking/save`
  - `POST /exif-viewer/parse`
  - `POST /*/exif-viewer/parse`
  - `POST /gear/*`
  - `POST /*/gear/*`
- Server-side BotID classification is isolated in `src/server/security/botid.ts`, which wraps `checkBotId()` and keeps request-scoped detection logic out of UI code.
- Vercel prerequisite: BotID expects the app to run behind Vercel so the challenge and verification headers are available. Per the Vercel BotID docs, local development returns `isBot: false` unless a development bypass is explicitly configured.

## Consolidated config directory

Tool-specific configuration files that support explicit paths live in `config/`:

- `config/playwright.config.ts`
- `config/vitest.config.ts`
- `config/drizzle.config.ts`

All related scripts in `package.json` use explicit `--config` paths so config resolution is deterministic in local development and CI.
