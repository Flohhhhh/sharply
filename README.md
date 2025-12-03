# Sharply

Sharply is a photography gear database and cataloging application. It combines authoritative gear specs, editorial reviews, and contributor tools so the community can keep data accurate while discovering new equipment.

## Tech Stack

- **Framework**: Next.js 15 (App Router) with React 19
- **Language**: TypeScript
- **UI**: Tailwind CSS 4, shadcn/ui
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: NextAuth.js v5 with Discord & Google providers
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

Required environment variables (see `src/env.js` for validation):

- `AUTH_SECRET` (generate your own)
- `AUTH_DISCORD_ID` & `AUTH_DISCORD_SECRET`
- `AUTH_GOOGLE_ID` & `AUTH_GOOGLE_SECRET`
- `DATABASE_URL` (Postgres connection string)
- `CRON_SECRET` (generate your own)
- `DISCORD_ROLLUP_WEBHOOK_URL` (optional locally)
- `OPENAI_API_KEY`

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

```bash
npm run db:migrate        # apply migrations to your local database to setup the schema
npm run db:seed           # (optional) populate sample data
npx drizzle-kit studio    # (optional) view the database in Drizzle studio (or use your own viewer)
```

### Development Server

```bash
npm run dev
```

This starts Next.js on `http://localhost:3000`. The first build will also run `npm run constants:generate` via `prebuild`.

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
3. Generate migrations with `npm run db:generate`, they will be applied during CI.
4. Update relevant docs in `/docs` alongside code changes.
5. Run `npm run lint` and and `npm run typecheck` or `npm run build` and fix any errors in touched files.
6. Open a pull request with context on the changes and testing performed.

## Support

- Review documentation in `/docs` for deeper architecture details.
- For questions, open an issue or reach out to the maintainers listed in `AGENTS.md`.
