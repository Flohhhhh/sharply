## Adding a new column (core gear or camera/lens specs)

This guide explains the minimal, end‑to‑end flow to add a new field to the data model, wire it through the UI, and keep types correct.

- Core gear fields live on `gear` (e.g., `genres` cache).
- Camera/Lens spec fields live on `camera_specs` or `lens_specs`.

The project uses Drizzle ORM for schema, with a convenience script to push schema changes directly to the database.

### TL;DR

Pick your path:

- Core field on `gear` (example: `genres`)
  1. Edit `src/server/db/schema.ts` → add the column on `gear` (and optionally add taxonomy/join tables)
  2. Run DB sync: `npm run db:push`
  3. Add field UI in `src/app/(pages)/gear/_components/edit-gear/fields-core.tsx`
  4. Add the key to `coreKeys` in `edit-gear-form.tsx` so it’s included in the diff payload
  5. If it needs coercion (dates/numbers/booleans), update `normalizeProposalPayloadForDb`
  6. If it’s taxonomy‑driven, export options via `scripts/generate-constants.ts` and use them in the UI
  7. Test (typecheck, lint, build, manual UI)

- Camera/Lens spec field
  1. Edit `src/server/db/schema.ts` → add column to `camera_specs` or `lens_specs`
  2. Run DB sync: `npm run db:push`
  3. Add field UI (`fields-cameras.tsx` or `fields-lenses.tsx`)
  4. Add the key to `cameraKeys` or `lensKeys` in `edit-gear-form.tsx`
  5. Add coercion rules in `normalizeProposalPayloadForDb` as needed
  6. Test

---

## 1) Update the database schema

Edit `src/server/db/schema.ts` and add your new column to either `gear`, `cameraSpecs`, or `lensSpecs`.

Examples:

1. Core gear field (jsonb cache for use cases)

```ts
// src/server/db/schema.ts
export const gear = createTable(
  "gear",
  (d) => ({
    // ...existing columns...
    genres: jsonb("genres"), // array of genre slugs for fast reads/filters
    // ...existing columns...
  }),
  // indexes...
);
```

Optional (taxonomy + join):

```ts
export const genres = createTable("genres", (d) => ({
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()::text`),
  name: varchar("name", { length: 200 }).notNull().unique(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  description: varchar("description", { length: 500 }),
  createdAt,
  updatedAt,
}));

export const gearGenres = createTable(
  "gear_genres",
  (d) => ({
    gearId: d
      .varchar("gear_id", { length: 36 })
      .notNull()
      .references(() => gear.id, { onDelete: "cascade" }),
    genreId: d
      .varchar("genre_id", { length: 36 })
      .notNull()
      .references(() => genres.id, { onDelete: "cascade" }),
    createdAt,
  }),
  (t) => [primaryKey({ columns: [t.gearId, t.genreId] })],
);
```

2. Camera spec: Add a decimal width in inches

```ts
// src/server/db/schema.ts
export const cameraSpecs = createTable(
  "camera_specs",
  (d) => ({
    // ...existing columns...
    widthInches: decimal("width_inches", { precision: 5, scale: 2 }),
    // ...existing columns...
  }),
  (t) => [
    // optional indexes
  ],
);
```

Notes

- Use snake_case for column names in the database: `width_inches`
- Choose an appropriate type:
  - decimal(...) for fractional numeric values (set precision/scale)
  - integer(...) for whole numbers
  - boolean(...) for flags
  - varchar/text for strings
- Add an index if the field will be used in filters or joins frequently

## 2) Push schema changes to the DB

Run the project’s push script to apply the schema diff directly to your database:

```bash
npm run db:push
```

This updates the DB to match `schema.ts`. No manual SQL file is required for this path.

If you prefer a migration file workflow, you can still use `npm run db:generate` to emit SQL and then `npm run db:migrate`, but for most incremental spec fields, `db:push` is the fastest path.

## 3) Add the form field in the UI

Add the new field to the relevant editor component.

- Core gear: `src/app/(pages)/gear/_components/edit-gear/fields-core.tsx`
- Cameras: `src/app/(pages)/gear/_components/edit-gear/fields-cameras.tsx`
- Lenses: `src/app/(pages)/gear/_components/edit-gear/fields-lenses.tsx`

Example – camera spec using `NumberInput` wrapper:

```tsx
// src/app/(pages)/gear/_components/edit-gear/fields-cameras.tsx
<NumberInput
  id="widthInches"
  label="Width (inches)"
  value={currentSpecs?.widthInches ?? null}
  onChange={(value) => handleFieldChange("widthInches", value)}
  placeholder="e.g., 5.50"
  step={0.01}
  min={0}
/>
```

Tips

- Reuse custom inputs where it improves UX (e.g., `CurrencyInput`, `ApertureInput`, `IsoInput`, `SensorFormatInput`)
- For whole numbers set `step={1}` (e.g., FPS); for decimals set `step` accordingly

## 4) Handle unit conversions (only if needed)

When storage and display units differ, add or reuse helpers in `src/lib/utils.ts`.

Examples already in the project:

- `centsToUsd()` and `usdToCents()` for currency

If you introduce new units, follow the same pattern: keep helpers pure and reusable, convert on input/output boundaries in the form components.

## 5) Test

Recommended checks:

- Typecheck: `npm run typecheck`
- Lint: `npm run lint`
- Build: `npm run build`
- Manually verify the edit page (open a camera/lens edit screen)
- Optionally add a quick demo in `src/app/(pages)/ui-demo/page.tsx`

---

## Add a core field example: `genres`

This example shows a DB‑driven multiselect with a join table plus a denormalized cache on `gear.genres` (array of slugs) for fast reads/filters.

1. Schema

```ts
// schema.ts (inside gear)
genres: jsonb("genres"), // array of slugs

// Optional taxonomy + join (recommended)
// tables: genres, gearGenres (see examples above)
```

2. Sync schema

```bash
npm run db:push
```

3. Constants & options (DB‑driven)

Update `scripts/generate-constants.ts` to export `GENRES` from the `sharply_genres` table, then generate:

```bash
npm run constants:generate
```

Import options in the UI from `~/lib/constants` (`GENRES` is re‑exported from `src/lib/generated.ts`).

4. UI

Add a multiselect to `fields-core.tsx` using `GENRES`:

```tsx
import MultiSelect from "~/components/ui/multi-select";
import { GENRES } from "~/lib/constants";

const genreOptions = (GENRES as any[]).map((g) => ({
  id: (g.slug as string) ?? (g.id as string),
  name: (g.name as string) ?? (g.slug as string),
}));

<MultiSelect
  options={genreOptions}
  value={currentSpecs.genres ?? []}
  onChange={(ids) => onChange("genres", ids)}
  placeholder="Select use cases..."
/>;
```

5. Include in diff payload

Add the key to the `coreKeys` list in `edit-gear-form.tsx`:

```ts
const coreKeys = [
  "name",
  "brandId",
  "mountId",
  "releaseDate",
  "msrpUsdCents",
  "weightGrams",
  "linkManufacturer",
  "linkMpb",
  "linkAmazon",
  "genres", // <= add this
] as const;
```

6. Normalization rules (optional)

If the core field needs coercion (e.g., dates/numbers/booleans), add handling in `normalizeProposalPayloadForDb`. For `genres` (string[]), pass‑through is fine.

7. Approval flow

The admin approve route already applies `payload.core` directly to `gear`. If you are also maintaining a join table (`gear_genres`), sync it when approving (insert/deletes based on the slug list) and keep `gear.genres` updated. Consider doing this in a DB transaction.

8. Filtering & indexing

To filter by a genre slug:

```sql
SELECT * FROM sharply_gear WHERE genres @> '["wildlife"]';
```

For frequent JSONB filtering, consider a GIN index, e.g. `CREATE INDEX ON sharply_gear USING GIN (genres jsonb_path_ops);`

9. Seeding (optional)

Seed default genres and link some to gear in `scripts/seed.ts`, then regenerate constants:

```bash
npm run db:seed
npm run constants:generate
```

---

## Example: Add `widthInches` to camera specs

1. Schema

```ts
// schema.ts (inside cameraSpecs)
widthInches: decimal("width_inches", { precision: 5, scale: 2 }),
```

2. Push

```bash
npm run db:push
```

3. UI

```tsx
// fields-cameras.tsx
<NumberInput
  id="widthInches"
  label="Width (inches)"
  value={currentSpecs?.widthInches ?? null}
  onChange={(value) => handleFieldChange("widthInches", value)}
  placeholder="e.g., 5.50"
  step={0.01}
  min={0}
/>
```

That’s it—types flow automatically from `schema.ts`, and the form will carry the new value through the existing `onChange` pipeline.
