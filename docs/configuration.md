# Configuration Layout

This project keeps root-level configuration files to the minimum required by framework and platform conventions.

## Error monitoring

Sentry is initialized for the browser, Node.js, and Edge runtimes. Set
`SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` (normally to the same project DSN) to
enable error monitoring and tracing. Development traces are sampled at 100%; other
environments use a 10% sample rate.

Production builds upload source maps when `SENTRY_ORG`, `SENTRY_PROJECT`, and the
secret `SENTRY_AUTH_TOKEN` are available. The SDK detects Vercel environments and
injects a shared release identifier into browser and server bundles automatically;
`SENTRY_ENVIRONMENT` and `SENTRY_RELEASE` are optional overrides. Server stack-frame
local variables are not collected. The `/monitoring` tunnel route is reserved for
Sentry and bypasses the locale proxy.

The framework entrypoints live at `src/instrumentation.ts` and
`src/instrumentation-client.ts`, as required by Next.js. Runtime-specific Sentry
initializers are grouped under `src/instrumentation/`.

When neither DSN is configured, the Sentry build wrapper is disabled. Local
development and E2E runs therefore do not generate source maps, add a tunnel, or
send telemetry unless Sentry is deliberately enabled in that environment.

## Root-level config files

- `next.config.js` (Next.js auto-discovery requires root)
- `tsconfig.json` (TypeScript and editor tooling default project config)
- `prettier.config.js` (shared formatter config referenced by scripts)
- `package.json` (project manifest and script entry points)
- `.env.example` (documented environment variable template)
- `vercel.json` (Vercel project configuration at root)
- `.github/workflows/lint.yml` (GitHub Actions lint check for pull requests and merge queue runs targeting `development`/`main`)
- `.github/workflows/unit-tests.yml` (GitHub Actions unit test check for pull requests and merge queue runs targeting `development`/`main`)
- `.github/workflows/build.yml` (GitHub Actions production build check for pull requests and merge queue runs targeting `development`/`main`)

## Vercel deployment gating

Vercel's Ignored Build Step is configured in `vercel.json` to run
`bash scripts/vercel-ignore-build.sh`. Vercel interprets exit code `0` as "skip
this deployment" and exit code `1` as "continue building."

The script permits direct pushes to `main` and `development`. It ignores every
pull request deployment, including PRs from branches in this repository, and
ignores all other branch or incomplete-metadata deployments. `development` is
therefore the shared preview environment, updated after changes reach that
branch, while `main` remains the production deployment source.

Pull requests still run the separate GitHub Actions build check. That workflow
disables database-backed constant generation, uses non-secret placeholder
configuration, and runs Next.js in compile build mode. Compile mode verifies the
production webpack compilation and TypeScript checks without running the
database-backed page-generation phase. Full page generation remains covered by
Vercel's trusted `main` and `development` builds. This lets public contributors
prove the application compiles without receiving deployment credentials or
database access. Exceptional PR previews must be initiated manually in Vercel;
automated opt-in previews are not part of the current policy.

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
  - `POST /lists/under-construction`
  - `POST /*/lists/under-construction`
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
