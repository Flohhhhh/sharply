# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sharply is a photography gear database and cataloging application built with Next.js 15 (App Router), React 19, TypeScript, and Drizzle ORM. It combines authoritative gear specs, editorial reviews, and contributor tools.

## Commands

```bash
# Development
npm run dev               # Start dev server at http://localhost:3000

# Database
npm run db:generate       # Generate migrations from schema changes
npm run db:migrate        # Apply pending migrations
npm run db:seed -- --confirm-seed  # Seed sample data (required flag)
npx drizzle-kit studio    # View database in Drizzle UI

# Code quality
npm run lint              # ESLint check
npm run lint:fix          # ESLint with auto-fix
npm run typecheck         # TypeScript type checking
npm run check             # lint + typecheck combined
npm run format:write      # Prettier auto-format

# Build
npm run build             # Production build
```

## Architecture

### Server Code Pattern (data → service → actions)

All server code in `src/server/` follows a three-layer pattern documented in `docs/server-structure.md`:

1. **data.ts** - Raw database operations using Drizzle. No auth, no caching. Never imported by UI code.
2. **service.ts** - Business logic, auth/role checks, composes data calls. Called by pages, API routes, server components.
3. **actions.ts** - Server Actions marked with "use server". Thin wrappers for client-triggered mutations only (never for reads).

Import flow: UI → service/actions, actions → service, service → data

### Key Directories

- `src/app/(app)/(pages)/` - Main content routes
- `src/app/(app)/api/` - API routes
- `src/server/` - Server code organized by domain (gear/, auth/, admin/, search/, etc.)
- `src/server/db/schema.ts` - Complete Drizzle ORM schema (all tables prefixed with `sharply_`)
- `src/components/ui/` - shadcn/ui components
- `docs/` - Architecture and feature documentation

### Database

- **ORM**: Drizzle ORM with PostgreSQL
- **Schema**: `src/server/db/schema.ts` is the source of truth
- **Migrations**: Auto-generated in `drizzle/` via `npm run db:generate`

**Important**: NEVER run `db:push` or `drizzle-kit push`. Always use `db:generate` then `db:migrate`.

### Authentication

BetterAuth with Passkeys, Discord OAuth, Google OAuth, and Email OTP. Session helpers in `src/server/auth/session-helpers.ts`. User roles: USER, MODERATOR, EDITOR, ADMIN, SUPERADMIN.

## Code Guidelines

- Do not abbreviate variable or function names. Use descriptive words.
- Do not delete comments if related code still exists. Update comments if code changes.
- Server actions are for mutations only, never for fetching data.
- Import from `service.ts` in pages and API routes, not from `data.ts`.
- Run `npm run lint` after changes and fix errors (not warnings) in touched files.
- Update docs in `/docs` when making schema or architectural changes.

## Environment

Core required variables: `AUTH_SECRET`, `DATABASE_URL`, `NEXT_PUBLIC_BASE_URL`. See `.env.example` for full list. Environment validated via `src/env.js`.
