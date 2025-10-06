## Adding a new column (core gear or camera/lens specs)

This guide explains the minimal, end‑to‑end flow to add a new field to the data model, wire it through the UI, and keep types correct.

- Core gear fields live on `gear` (e.g., `genres` cache, `widthMm/heightMm/depthMm`).
- Camera/Lens spec fields live on `camera_specs` or `lens_specs`.

The project uses Drizzle ORM for schema, and we manage changes via generated SQL migrations only.

### Quick steps (do this)

1. Update schema in `src/server/db/schema.ts` (add column on `camera_specs`, `lens_specs`, or `gear`).
2. Generate and apply migration: `npm run db:generate && npm run db:migrate`.
3. Wire the editor UI:
   - Add an input in `fields-cameras.tsx`, `fields-lenses.tsx`, or `fields-core.tsx`.
   - Add the key to the diff whitelist in `edit-gear-form.tsx` (`cameraKeys`, `lensKeys`, or `coreKeys`).
4. Normalize on submit in `src/server/db/normalizers.ts` (coerce to DB-safe types; enums as string pass‑through or enum-check).
5. Add the spec to the registry: update `src/lib/specs/registry.tsx` to include the new field with proper label, formatting, and section grouping.

#### Example – add Camera Type enum to camera specs

1. Schema (`src/server/db/schema.ts`):

```ts
// define enum
export const cameraTypeEnum = pgEnum("camera_type_enum", [
  "dslr",
  "mirrorless",
  "slr",
  "action",
  "cinema",
]);

// add column on camera_specs
cameraType: cameraTypeEnum("camera_type"),
```

2. Normalizer (`src/server/db/normalizers.ts`):

```ts
cameraType: z
  .preprocess((value) => {
    if (value === null) return null;
    if (typeof value !== "string") return undefined;
    const allowed = (ENUMS as any).camera_type_enum;
    return (allowed as readonly string[]).includes(value) ? value : undefined;
  }, z.string().nullable().optional())
  .optional(),
```

3. Submit whitelist (`edit-gear-form.tsx`): add `"cameraType"` to `cameraKeys`.

4. UI (`fields-cameras.tsx`): add a `Select` bound to `cameraType` using `ENUMS.camera_type_enum`.

5. Display (`src/lib/specs/registry.tsx`): add "Camera Type" under Basic Information when `gearType === "CAMERA"`.

6) Test: `npm run typecheck && npm run lint && npm run build`, then verify edit and detail pages.

Optional (as needed):

- Unit conversions in `src/lib/utils.ts`.
- Constants/mappings and filters/search updates.
- Seed/editorial content and documentation updates.

---

## 1) Update the database schema

Edit `src/server/db/schema.ts` and add your new column to either `gear`, `cameraSpecs`, or `lensSpecs`.

Examples:

1. Core gear field (jsonb cache for use cases) and a numeric core spec (dimensions)

```ts
// src/server/db/schema.ts
export const gear = createTable(
  "gear",
  (d) => ({
    // ...existing columns...
    genres: jsonb("genres"), // array of genre slugs for fast reads/filters
    widthMm: decimal("width_mm", { precision: 6, scale: 2 }),
    heightMm: decimal("height_mm", { precision: 6, scale: 2 }),
    depthMm: decimal("depth_mm", { precision: 6, scale: 2 }),
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

### Example: Add enum-backed shutter/viewfinder fields

```ts
// schema.ts (inside cameraSpecs)
availableShutterTypes: shutterTypesEnum("available_shutter_types").array(),
viewfinderType: viewfinderTypesEnum("viewfinder_type"),
```

Notes

- Use snake_case for column names in the database: `width_inches`
- Choose an appropriate type:
  - decimal(...) for fractional numeric values (set precision/scale)
  - integer(...) for whole numbers
  - boolean(...) for flags
  - varchar/text for strings
- Add an index if the field will be used in filters or joins frequently

## 2) Generate and apply a migration

Create a migration and then apply it to your database:

```bash
npm run db:generate
npm run db:migrate
```

## 3) Add the form field in the UI

Add the new field to the relevant editor component.

- Core gear: `src/app/(app)/(pages)/gear/_components/edit-gear/fields-core.tsx`
- Cameras: `src/app/(app)/(pages)/gear/_components/edit-gear/fields-cameras.tsx`
- Lenses: `src/app/(app)/(pages)/gear/_components/edit-gear/fields-lenses.tsx`

Example – camera spec using `NumberInput` wrapper:

```tsx
// src/app/(app)/(pages)/gear/_components/edit-gear/fields-cameras.tsx
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

### 3.1 Submit flow: whitelist and normalize (required)

To include your new field in the confirmation dialog and proposal payload, you must:

- Add the key to the camera/lens diff whitelist in `edit-gear-form.tsx`.
- Add a normalization rule in `src/server/db/normalizers.ts` (string pass‑through for enums; numeric/date coercion for numbers/dates).

Whitelist example – allow `sensorStackingType` to flow through:

```ts
// src/app/(app)/(pages)/gear/_components/edit-gear/edit-gear-form.tsx
const cameraKeys = [
  "sensorFormatId",
  "resolutionMp",
  "isoMin",
  "isoMax",
  "maxFpsRaw",
  "maxFpsJpg",
  // add your new field(s) here
  "sensorStackingType",
] as const;
```

Normalization example – enum‑backed string as pass‑through:

```ts
// src/server/db/normalizers.ts (inside CameraSchema)
sensorStackingType: z
  .preprocess(
    (value) => (typeof value === "string" ? value : undefined),
    z.string().optional(),
  )
  .optional(),
```

Notes

- The whitelist determines which keys appear in the confirmation preview and get submitted (safety net: excludes ids/timestamps/unready fields).
- The normalizer ensures values are coerced to DB‑safe types before approval is applied.

Tips

- Reuse custom inputs where it improves UX (e.g., `CurrencyInput`, `ApertureInput`, `IsoInput`, `SensorFormatInput`)
- For whole numbers set `step={1}` (e.g., FPS); for decimals set `step` accordingly

## 4) Handle unit conversions (optional)

When storage and display units differ, add or reuse helpers in `src/lib/utils.ts`.

Examples already in the project:

- `centsToUsd()` and `usdToCents()` for currency

If you introduce new units, follow the same pattern: keep helpers pure and reusable, convert on input/output boundaries in the form components.

## 5) Test (required)

Recommended checks:

- Typecheck: `npm run typecheck`
- Lint: `npm run lint`
- Build: `npm run build`
- Manually verify the edit page (open a camera/lens edit screen)
- Optionally add a quick demo in `src/app/(app)/(pages)/ui-demo/page.tsx`

## Additional steps for complete integration

- **Service/data layering**: Keep DB reads/writes in `server/data`, orchestration/auth in `server/service`, and client-triggered mutations in `server/*/actions`. Don’t import data modules in UI; prefer calling service from server components or API. Actions are for mutations only. See `docs/server-structure.md`.
- **Filters/search (if filterable)**: Add filter UI under `src/components/search/*` and update backend logic in `src/server/search/*`. Consider indexes if the field is commonly filtered or sorted.
- **Constants/mappings (if enumerated)**: If options are taxonomy/enumeration-driven, update `scripts/generate-constants.ts` and regenerate constants. Update mappings under `src/lib/mapping/*` if relationships change. See `docs/constants-generation.md` and `docs/mapping-system.md`.
- **Seeding/editorial (optional)**: Backfill/demo values in `scripts/seed.ts` and/or `scripts/seed-editorial-data.ts` as needed.
- **Documentation**: Keep docs in sync; update `docs/gear-specification-system.md` and this file. If relationships change, also update `docs/mapping-system.md`.
- **Validation & QA**: If explicit validation exists, update schemas in `src/server/validation/*`. Run `npm run typecheck`, `npm run lint`, `npm run build`, and verify the edit/detail pages manually.

### Gear page specification list

When you add new specs, they are automatically displayed on the gear page through the spec registry:

1. Add the new field to the appropriate section in `src/lib/specs/registry.tsx`:

```tsx
// For camera specs - add to the appropriate section's data array
{
  label: "Sensor Stacking",
  value: cameraSpecsItem?.sensorStackingType
    ? String(cameraSpecsItem.sensorStackingType)
        .replace("-", " ")
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : undefined,
},
```

2. The field will automatically appear in the appropriate section (Sensor & Shutter, Hardware/Build, etc.) based on where you place it in the registry.

3. For compare functionality, the same spec will be available through `CompareSpecsTable` component which uses the same registry.

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

2. Generate and apply a migration

```bash
npm run db:generate
npm run db:migrate
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

2. Generate and apply a migration

```bash
npm run db:generate
npm run db:migrate
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
