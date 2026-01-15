# Sharply Project

Sharply is a photography gear database and cataloging application built with Next.js, TypeScript, and Drizzle ORM. The project manages camera equipment data including brands, mounts, sensor formats, and gear items with comprehensive search and categorization capabilities.

## Project Structure

- **Frontend**: Next.js 15 with React 19, TypeScript, and Tailwind CSS
- **Backend**: Next.js API routes with BetterAuth for authentication
- **Database**: PostgreSQL with Drizzle ORM
- **Schema**: Located in `src/server/db/schema.ts`
- **Documentation**: Stored in `/docs` folder
- **Migrations**: Stored in `/drizzle` folder

### UI Components

- **ShadcnUI** Components can be found in /app/components/ui

## Next JS Notes

- **Server actions** should never be used for fetching, only for mutations or other client > server actions

## Database Management

### Schema Changes

- **ALWAYS** make schema changes in `src/server/db/schema.ts`
- **NEVER** modify the database directly without going through the schema
- Use Drizzle's type-safe schema definitions

### Migration Guidelines

**For Contributors:**
1. Make schema changes in `src/server/db/schema.ts`
2. Test locally: Use `npm run db:push` to sync your local database with schema changes
3. **Do NOT** run `db:generate` or commit migration files
4. Commit only the schema changes (`schema.ts`)
5. Maintainers will generate a consolidated migration file when merging dev to main/staging
6. After migrations are merged, pull and run `npm run db:migrate` to sync your local database

**Database Setup Workflow:**
- **First-time setup**: New contributors use `npm run db:push` once to sync the schema directly from `src/server/db/schema.ts` for initial database setup
- **During development**: Use `npm run db:push` to test schema changes locally (do NOT generate migrations)
- **After migrations are merged**: Use `npm run db:migrate` to sync your local database with the consolidated migration
- **Important**: Contributors never generate or commit migration files - maintainers handle migration generation when merging dev to main/staging

## Documentation Management

### Keeping `/docs` Up to Date

- **ALWAYS** update relevant documentation when making schema changes
- **Document new features** and their database implications
- **Update gear-specification-system.md** when gear-related schemas change
- **Update mapping-system.md** when mapping or relationship logic changes
- **Maintain consistency** between code and documentation

### Documentation Standards

- Use clear, concise language
- Include examples where helpful
- Reference related schema files and migrations
- Keep documentation synchronized with code changes

## Agent-Specific Instructions

- **Always check linting** errors after significant changes using `npm run lint` and correct any errors related to changed/touched files in the scope of your task. (Errors only, not warnings)

### For Documentation Updates

- **Monitor schema changes** in `src/server/db/schema.ts`
- **Automatically update** relevant documentation files in `/docs`
- **Maintain consistency** between code and documentation
- **Reference migration files** when documenting database changes

### Server Code Structure (data/service/actions)

- Follow the server layering documented in `docs/server-structure.md`:
  - data/: raw DB reads/writes (no auth, no caching). Never imported by UI.
  - service/: orchestrated, safe server functions (auth/roles, composition).
  - actions/: Next.js server actions for client-triggered CRUD only.
- Prefer importing from service/ in pages, API routes, and server components.
- Do not introduce DB access inside UI or lib modules.
- Flow: data → service → actions. Auth/role checks live in service; actions are thin wrappers that delegate to service and may revalidate.

### For Database Migrations

- **First-time setup**: `db:push` is allowed for new contributors setting up a fresh database
- **During development**: Contributors use `db:push` to test schema changes locally (do NOT generate migrations)
- **For maintainers**: Generate consolidated migrations (`db:generate`) when merging dev to main/staging
- **After migrations merged**: Contributors use `db:migrate` to sync their local database
- **Important**: Contributors never generate or commit migration files - only maintainers do this when merging

### For Schema Changes

- **Always update documentation** when modifying schemas
- **Create migrations** for complex changes that can't be done in schema
- **Maintain referential integrity** in database relationships

## Important Notes

- **Database changes require both schema updates AND migrations**
- **Documentation must stay synchronized with code changes**
- **Follow existing naming conventions** for consistency
- **Use Drizzle ORM features** instead of raw SQL when possible
