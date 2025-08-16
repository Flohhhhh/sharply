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

### Migration Process

When database changes cannot be made through schema updates alone:

1. **Create individual migration files** in the `/drizzle` folder
2. **Use descriptive names** for migration files (e.g., `add_user_preferences.sql`)
3. **Follow existing naming convention**: `000X_descriptive_name.sql`
4. **Update documentation** in `/docs` folder to reflect changes

### Migration Guidelines

Do not create migration files, just make changes to schema, then developer will run the migration generation and push scripts

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

### For Documentation Updates

- **Monitor schema changes** in `src/server/db/schema.ts`
- **Automatically update** relevant documentation files in `/docs`
- **Maintain consistency** between code and documentation
- **Reference migration files** when documenting database changes

### For Database Migrations

- **Create individual migration files** in `/drizzle` folder
- **Use descriptive names** following the existing pattern
- **Update documentation** to reflect migration changes
- **Follow Drizzle best practices** for migration creation

### For Schema Changes

- **Always update documentation** when modifying schemas
- **Create migrations** for complex changes that can't be done in schema
- **Maintain referential integrity** in database relationships

## Important Notes

- **Database changes require both schema updates AND migrations**
- **Documentation must stay synchronized with code changes**
- **Follow existing naming conventions** for consistency
- **Use Drizzle ORM features** instead of raw SQL when possible
