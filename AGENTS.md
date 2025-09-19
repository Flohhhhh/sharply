# Sharply Project

Sharply is a photography gear database and cataloging application built with Next.js, TypeScript, and Drizzle ORM. The project manages camera equipment data including brands, mounts, sensor formats, and gear items with comprehensive search and categorization capabilities.

## Project Structure

- **Frontend**: Next.js 15 with React 19, TypeScript, and Tailwind CSS
- **Backend**: Next.js API routes with NextAuth for authentication
- **Database**: PostgreSQL with Drizzle ORM
- **Schema**: Located in `src/server/db/schema.ts`
- **Documentation**: Stored in `/docs` folder
- **Migrations**: Stored in `/drizzle` folder

## Database Management

### Schema Changes

- **ALWAYS** make schema changes in `src/server/db/schema.ts`
- **NEVER** modify the database directly without going through the schema
- Use Drizzle's type-safe schema definitions

### Migration Guidelines

Do not create migration files, just make changes to schema, then developer will run the migration generation and push scripts.

NEVER RUN DB:PUSH OR drizzle-kit push

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

NEVER RUN DB:PUSH or drizzle-kit push

### For Schema Changes

- **Always update documentation** when modifying schemas
- **Create migrations** for complex changes that can't be done in schema
- **Maintain referential integrity** in database relationships

## Important Notes

- **Database changes require both schema updates AND migrations**
- **Documentation must stay synchronized with code changes**
- **Follow existing naming conventions** for consistency
- **Use Drizzle ORM features** instead of raw SQL when possible
