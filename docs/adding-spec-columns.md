## Adding a new spec column (camera or lens)

This guide explains the minimal, end‑to‑end flow to add a new spec field (column) to either camera or lens specs, wire it through the UI, and keep types correct.

The project uses Drizzle ORM for schema, with a convenience script to push schema changes directly to the database.

### TL;DR

1. Edit `src/server/db/schema.ts` to add the new column
2. Run the database sync: `npm run db:push`
3. Add the field to the relevant edit form component
4. If any unit conversion is needed, add/use a helper in `src/lib/utils.ts`
5. Test locally (build, typecheck, and UI)

---

## 1) Update the database schema

Edit `src/server/db/schema.ts` and add your new column to either `cameraSpecs` or `lensSpecs`.

Example: Add a decimal width in inches to camera specs

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

Add the new field to the relevant editor component:

- Cameras: `src/app/(pages)/gear/_components/edit-gear/fields-cameras.tsx`
- Lenses: `src/app/(pages)/gear/_components/edit-gear/fields-lenses.tsx`

Example using the existing `NumberInput` wrapper:

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
