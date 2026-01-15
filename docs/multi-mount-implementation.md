# Multi-Mount Support Implementation

## Overview

Support for lenses with multiple compatible mounts has been implemented using an expand/contract pattern for backward compatibility. This allows third-party lenses (e.g., Sigma, Tamron) to specify all compatible mounts while maintaining compatibility with existing code.

## Database Schema Changes

### New Table: `gear_mounts`

A many-to-many junction table linking gear to mounts:

```sql
CREATE TABLE app.gear_mounts (
  gear_id VARCHAR(36) NOT NULL REFERENCES app.gear(id) ON DELETE CASCADE,
  mount_id VARCHAR(36) NOT NULL REFERENCES app.mounts(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (gear_id, mount_id)
);

CREATE INDEX gear_mounts_gear_idx ON app.gear_mounts(gear_id);
CREATE INDEX gear_mounts_mount_idx ON app.gear_mounts(mount_id);
```

### Backward Compatibility

- **`gear.mountId`** column is **retained** and stores the "primary" mount
- When `mountIds` array is provided in proposals:
  - Junction table (`gear_mounts`) is updated with all mounts
  - `gear.mountId` is set to the first mount in the array
- Existing queries using `gear.mountId` continue to work

## UI Components

### MountSelect Component

Location: `src/components/custom-inputs/mount-select.tsx`

A flexible component that supports both single and multi-select modes:

```tsx
<MountSelect
  value={formattedMountValue}
  onChange={handleMountChange}
  mode={gearType === "CAMERA" ? "single" : "multiple"}
  label="Mount"
/>
```

**Props:**

- `value`: `string | string[] | null` - Current selection(s)
- `onChange`: Callback with single string (cameras) or array (lenses)
- `mode`: `"single"` or `"multiple"` - Renders appropriate input
- `label`: Label text (default: "Mount")
- `placeholder`: Placeholder text

**Behavior:**

- **Single mode**: Renders shadcn `Select` component (cameras)
- **Multiple mode**: Renders `MultiSelect` component with tags (lenses)

### Edit Form Integration

Location: `src/app/(app)/(pages)/gear/_components/edit-gear/fields-core.tsx`

The `CoreFields` component now accepts `gearType` prop to determine mount input behavior:

```tsx
<CoreFields
  currentSpecs={{ ...formData, mountId, mountIds }}
  gearType={gearType} // "CAMERA" or "LENS"
  onChange={handleChange}
/>
```

**Field Handling:**

- **Cameras**: Use `mountId` (single string)
- **Lenses**: Use `mountIds` (string array)

## Data Flow

### 1. Edit Proposal Submission

```
User Input (UI)
  ↓
CoreFields → handleMountChange
  ↓
For CAMERA: onChange("mountId", singleValue)
For LENS:   onChange("mountIds", arrayValue)
  ↓
Edit Form → buildDiffPayload
  ↓
Payload: { core: { mountId OR mountIds } }
  ↓
normalizeProposalPayloadForDb (validates UUIDs)
  ↓
Server Action → submitGearEditProposal
```

### 2. Proposal Approval

```
Admin Approval
  ↓
approveProposalData (transaction)
  ↓
If mountIds present:
  1. DELETE FROM gear_mounts WHERE gear_id = ?
  2. INSERT INTO gear_mounts (gear_id, mount_id) VALUES ...
  3. UPDATE gear SET mount_id = mountIds[0]
  ↓
Commit transaction
```

## API & Service Layer

### Normalizer (Validation)

Location: `src/server/db/normalizers.ts`

```typescript
mountIds: z.preprocess((value) => {
  if (Array.isArray(value)) {
    return value.filter((id) => isUuid(id));
  }
  // Legacy: convert single mountId to array
  if (typeof value === "string" && isUuid(value)) {
    return [value];
  }
  return undefined;
}, z.array(z.string().uuid()).nullable().optional());
```

### Proposal Approval

Location: `src/server/admin/proposals/data.ts`

When `mountIds` is present in the core payload:

1. Validates array of UUIDs
2. Deletes existing `gear_mounts` rows for the gear
3. Inserts new rows for each mount
4. Updates `gear.mountId` to first mount (backward compatibility)

## Mapping & Display Helpers

Location: `src/lib/mapping/mounts-map.ts`

New helper functions for array support:

```typescript
// Single mount
getMountNameById(mountId: string): string
getMountLongNameById(mountId: string): string

// Multiple mounts (NEW)
getMountNamesById(mountIds: string[]): string
getMountLongNamesById(mountIds: string[]): string
```

**Usage:**

```typescript
// Admin proposal display
if (k === "mountIds") {
  return Array.isArray(v)
    ? v.map((id) => getMountLongNameById(id)).join(", ")
    : getMountLongNameById(v);
}
```

## Migration & Backfill

### Step 1: Test Schema Changes Locally

```bash
npm run db:push
```

This syncs your local database with the schema changes for `gear_mounts` table.

**Note**: Do not generate migration files. Maintainers will generate a consolidated migration when merging dev to main/staging.

### Step 2: Backfill Data

```bash
npx tsx scripts/backfill-gear-mounts.ts
```

Backfills `gear_mounts` from existing `gear.mountId` values:

```sql
INSERT INTO app.gear_mounts (gear_id, mount_id, created_at)
SELECT id, mount_id, now()
FROM app.gear
WHERE mount_id IS NOT NULL
ON CONFLICT (gear_id, mount_id) DO NOTHING;
```

## Testing Checklist

- [x] Schema changes applied
- [x] MountSelect component supports single/multi mode
- [x] Edit form passes correct gearType to CoreFields
- [x] Proposal normalization validates mountIds
- [x] Proposal approval writes to gear_mounts junction
- [x] Backward compatibility: gear.mountId still updated
- [x] Admin UI displays mountIds arrays correctly
- [ ] Manual: Test schema changes locally with `db:push`
- [ ] Manual: (Maintainers only) Generate consolidated migration when merging dev to main/staging
- [ ] Manual: Run backfill script
- [ ] Manual: Test creating/editing lens with multiple mounts
- [ ] Manual: Test camera mount editing (single select)
- [ ] Manual: Verify proposal approval flow

## Future Enhancements

### Phase 2 (Optional)

Once fully migrated and tested:

1. **Remove `gear.mountId` column**
   - Update all queries to use `gear_mounts` join
   - Drop column and index
   - Update types to remove `mountId` from `Gear`

2. **Data Layer Updates**
   - Add joins to `gear_mounts` in data queries
   - Return arrays of mounts from service layer
   - Update GearItem type to include `mounts: Mount[]`

3. **Search & Filtering**
   - Update search to join `gear_mounts` for mount filters
   - Update trending/popularity filters to use junction table

## Notes

- **Expand/Contract Pattern**: New functionality added without breaking existing code
- **Backward Compatibility**: `gear.mountId` maintained as "primary" mount
- **Junction Table**: Authoritative source for mount relationships
- **UI Flexibility**: Single component handles both camera (single) and lens (multi) cases
- **Validation**: Zod schemas ensure only valid UUIDs are stored
