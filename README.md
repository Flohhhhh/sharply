# Sharply

Sharply is a photography gear database and cataloging application. It combines authoritative gear specs, editorial reviews, and contributor tools so the community can keep data accurate while discovering new equipment.

<img width="1573" height="1016" alt="image" src="https://github.com/user-attachments/assets/acd51e9b-0c98-48c5-b62f-06049f8404a8" />

## Tech Stack

- **Framework**: Next.js 15 (App Router) with React 19
- **Language**: TypeScript
- **UI**: Tailwind CSS 4, shadcn/ui
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: BetterAuth with Passkeys, OTP, and Discord & Google providers
- **AI & Integrations**: OpenAI API, Payload CMS for editorial content
- **Tooling**: ESLint, Prettier, TypeScript, Drizzle Kit

## Prerequisites

- Node.js 20 (LTS) and npm 10
- PostgreSQL 15+ (local or containerized)
- pnpm or yarn are not officially supported; use npm
- Docker or Podman (optional) if you want the provided database script
- An `.env` file configured from `.env.example`

## Getting Started

Clone the repository and install dependencies:

```bash
git clone https://github.com/Flohhhhh/sharply.git
cd sharply
npm install
```

Copy the template environment file and fill in required secrets:

```bash
cp .env.example .env
```

### Environment variables

Sharply validates configuration through `src/env.js`. For onboarding you only need to set the values that power the features you plan to exercise:

**Core minimum (the app will crash without these)**

- `AUTH_SECRET` – used by BetterAuth for session encryption (`src/server/auth/index.ts`)
- `DATABASE_URL` – establishes the Drizzle/Postgres connection (`src/server/db/index.ts`)
- `NEXT_PUBLIC_BASE_URL` – required when building canonical URLs and Discord bot links (`src/server/gear/browse/service.ts`)

**Sign-in providers (pick whichever providers you keep enabled in `src/server/auth/config.ts`)**

- Discord OAuth: `AUTH_DISCORD_ID`, `AUTH_DISCORD_SECRET`
- Google OAuth: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
- Email magic links: `RESEND_API_KEY`, `RESEND_EMAIL_FROM` (also used by `payload.config.ts` for Resend email delivery)

If you do not plan to use a provider locally, comment it out in `src/server/auth/config.ts` and you can skip its credentials.

**Feature-specific values (optional until you need the feature)**

- `CRON_SECRET` – only required when hitting the secured cron routes such as `/api/admin/popularity/rollup`
- `DISCORD_ROLLUP_WEBHOOK_URL` – used to post rollup status messages to Discord; rollups still run without it
- `OPENAI_API_KEY` – enables AI review summaries; `src/server/reviews/summary/service.ts` safely no-ops if it is missing
- `PAYLOAD_SECRET` & `UPLOADTHING_TOKEN` – used exclusively by the Payload CMS instance (`src/payload.config.ts`); the main Next.js app does not import them

> Use the template comments as guidance; keep secrets out of version control.

### Database

You can run Postgres however you prefer. Two common options:

1. **Local installation**: create a database and ensure the URL in `.env` points to it.
2. **Docker/Podman**: run the helper script:

   ```bash
   ./start-database.sh
   ```

   The script reads `DATABASE_URL` from `.env`, creates a matching container, and warns if ports are in use.

After Postgres is running:

**First-time setup** (for new contributors setting up a fresh database):

```bash
npm run db:push           # sync schema directly from src/server/db/schema.ts (one-time initial setup)
npm run db:seed           # (optional) populate sample data
npx drizzle-kit studio    # (optional) view the database in Drizzle studio (or use your own viewer)
```

**After pulling changes** (when migrations have been generated and merged to main):

```bash
npm run db:migrate        # apply pending migrations to your LOCAL database
```

**During development** (when working on schema changes):

```bash
npm run db:push           # sync your local database with schema.ts changes (for testing)
```

> **Note**:
>
> - Use `db:push` to test schema changes locally during development
> - Do NOT generate migration files (`db:generate`) - maintainers will generate a consolidated migration when merging dev to main/staging
> - After migrations are merged, use `db:migrate` to sync your local database
> - Never run migrations against production/staging databases

> `npm run db:seed` requires you to append `-- --confirm-seed` (for example `npm run db:seed -- --confirm-seed`). This keeps the safeguard in place so the script only runs when you explicitly acknowledge it and target a dev database. It will not overwrite existing gear unless you also pass `--allow-gear-overwrite`.

### Seed Data

The seed script (`scripts/seed.ts`) is non-destructive by default and populates:

- Brands, mounts, sensor formats, genres, AF area modes
- Nikon Z6 III (fully hydrated: specs, mounts, AF areas, genres, editorial, reviews, review summaries)
- Canon EOS R6 Mark III
- Nikon Zf/Zr
- Nikon AF-S DX NIKKOR 35mm f/1.8G
- Nikon AF-S NIKKOR 50mm f/1.8G

Flags:

- `--confirm-seed` (required): safety gate to prevent accidental production writes
- `--allow-gear-overwrite`: allow updating existing gear rows; without this, existing gear is left untouched
- `--skip-taxonomy`: skip brands/mounts/formats/genres/AF area modes
- `--skip-editorial`: skip editorial content (use-case ratings, staff verdicts)
- `--skip-reviews`: skip reviews and AI summaries

Examples:

```bash
npm run db:seed -- --confirm-seed
npm run db:seed -- --confirm-seed --skip-reviews
npm run db:seed -- --confirm-seed --allow-gear-overwrite
```

### Development Server

```bash
npm run dev
```

This starts Next.js on `http://localhost:3000`.

### Code Quality

- `npm run lint` – ESLint (required after significant changes)
- `npm run typecheck` – TypeScript with `--noEmit`
- `npm run check` – Combined lint + typecheck

## Project Structure

- `src/app` – Next.js App Router routes, layouts, and pages
- `src/components` – Shared UI components (shadcn/ui lives in `src/components/ui`)
- `src/server` – Server-only code
  - `db` – Drizzle client and schema definitions
  - `gear`, `admin`, `auth`, etc. – Service layers following `data → service → actions`
- `src/lib` – Utilities, constants, mapping logic
- `docs` – Architecture and feature documentation (keep docs updated when code changes)
- `drizzle` – Generated SQL migrations
- `scripts` – Node scripts for seeding and maintenance

## Contributing

1. Fork or create a feature branch.
2. Keep schema changes in `src/server/db/schema.ts`; do not edit migrations manually.
3. **Database workflow**:
   - Make schema changes in `src/server/db/schema.ts`
   - Test locally: Use `npm run db:push` to sync your local database with schema changes
   - **Do NOT** run `db:generate` or commit migration files - maintainers will generate a consolidated migration when merging dev to main/staging
   - Commit only the schema changes (`schema.ts`)
   - After migrations are merged to main, pull and run `npm run db:migrate` to sync your local database
4. **First-time setup**: New contributors use `npm run db:push` once for initial database setup
5. Update relevant docs in `/docs` alongside code changes.
6. Run `npm run lint` and `npm run typecheck` or `npm run build` and fix any errors in touched files.
7. Open a pull request with context on the changes and testing performed.

## Support

- Review documentation in `/docs` for deeper architecture details.
- For questions, open an issue or reach out to the maintainers listed in `AGENTS.md`.

Note: This project does not include production database contents. Any live/production data (editorial, user content, or other proprietary datasets) is not included or licensed as part of this repository.
