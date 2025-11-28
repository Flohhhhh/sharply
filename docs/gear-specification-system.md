# Gear Specification System

## Overview

The gear specification system uses a flexible subtable approach to store detailed specifications for different types of gear items. This design allows for type-specific data while maintaining a clean, normalized database structure.

## Architecture

### Core Tables

#### `gear` - Main Gear Table

The central table that stores common gear information:

- **Basic Info**: ID, slug, name, search name
- **Classification**: Gear type (CAMERA, LENS)
- **Brand & Mount**: References to brands and mounts
  - `mountId`: Single mount reference (kept for backward compatibility, stores "primary" mount)
  - Mount relationships managed via `gear_mounts` junction table for multi-mount support
- **Metadata**: Release date, price, thumbnail URL
- **User Notes**: `notes` — `text[]` for unstructured notes
- **Commerce**: `mpbMaxPriceUsdCents` — optional MPB max price (USD cents)
- **Core Specs**: Physical dimensions (width, height, depth in mm), weight
- **Timestamps**: Created/updated tracking

#### `gear_mounts` - Gear-Mount Junction Table

Many-to-many relationship table for gear that supports multiple mounts (e.g., third-party lenses available in multiple mounts):

- **Primary Key**: Composite (`gearId`, `mountId`)
- **Gear Reference**: Foreign key to `gear.id` (cascade on delete)
- **Mount Reference**: Foreign key to `mounts.id` (restrict on delete)
- **Use Cases**:
  - Lenses: Can have multiple compatible mounts (e.g., Sigma lenses in Canon RF, Nikon Z, Sony E)
  - Cameras: Typically have single mount (use `gear.mountId` for backward compatibility)
- **Indexes**: Indexed on both `gearId` and `mountId` for efficient lookups

#### `cameraSpecs` - Camera Specifications

Stores detailed camera-specific specifications:

- **Primary Key**: `gearId` (1:1 relationship with gear)
- **Sensor**: Format reference, resolution in megapixels
- **Performance**: ISO range (min/max), IBIS (in-body stabilization), available shutter types, viewfinder type
- **Precapture**: `precaptureSupportLevel` (`integer`, null allowed) tracks buffer support
  - `0`: No precapture buffer
  - `1`: Yes (RAW)
  - `2`: Yes (JPEG only)
- **Displays**: rear display type (none, fixed, single_axis_tilt, dual_axis_tilt, fully_articulated), rear display size (inches), rear display resolution (million dots), has top display, has rear touchscreen
- **Viewfinder**: type (none/optical/electronic), magnification (x), resolution (million dots)
- **Video**: Maximum video resolution
- **Flexibility**: JSONB extra field for additional specs

#### `lensSpecs` - Lens Specifications

Stores detailed lens-specific specifications:

- **Primary Key**: `gearId` (1:1 relationship with gear)
- **Focal Length**: Minimum and maximum focal length in mm
- **Aperture**: Maximum aperture value
- **Stabilization**: Whether the lens has stabilization
- **Flexibility**: JSONB extra field for additional specs

#### `fixed_lens_specs` - Integrated Lens Specifications (Cameras)

For cameras that use the `fixed-lens` mount, a simplified lens spec table stores the integrated lens details:

- Primary Key: `gearId` (1:1 with `gear`)
- Fields:
  - `isPrime` (boolean)
  - `focalLengthMinMm` (int), `focalLengthMaxMm` (int)
  - `maxApertureWide` (decimal), `maxApertureTele` (decimal)
  - `minApertureWide` (decimal), `minApertureTele` (decimal)
  - `hasAutofocus` (boolean)
  - `minimumFocusDistanceMm` (int)
  - `frontElementRotates` (boolean)
  - `frontFilterThreadSizeMm` (int)
  - `hasLensHood` (boolean)

UI: On the edit form, when the Mount is `fixed-lens` (via `mountIds[0]` or `mountId`), an "Integrated Lens" section appears, reusing the same focal length and aperture inputs as standalone lens editing.

Rendering: On gear pages for cameras with `fixed-lens`, a dedicated "Integrated Lens" specs section is displayed.

## Database Schema

The system uses three main tables with the following structure:

```sql
-- Core gear table with common fields
CREATE TABLE sharply_gear (
  -- Primary key and identifiers
  -- Basic information (name, slug, search name)
  -- Classification (gear type, brand, mount)
  -- Metadata (release date, price, thumbnail)
  -- Timestamps
);

-- Camera specifications table
CREATE TABLE sharply_camera_specs (
  -- Primary key referencing gear table
  -- Sensor-related specifications
  -- Performance specifications
  -- Video capabilities
  -- Flexible extra data field
  -- Timestamps
);

-- Lens specifications table
CREATE TABLE sharply_lens_specs (
  -- Primary key referencing gear table
  -- Optical specifications
  -- Mechanical features
  -- Flexible extra data field
  -- Timestamps
);
```

## Relationships

### One-to-One Relationships

- Each gear item has exactly one set of specifications
- Camera gear → `cameraSpecs`
- Lens gear → `lensSpecs`
- Enforced by primary key constraints on `gearId`

### Foreign Key Relationships

- **Gear → Brands**: Required relationship (restrict delete)
- **Gear → Mounts**: Optional relationship (set null on delete)
- **Camera Specs → Sensor Formats**: Optional relationship (set null on delete)

### Cascade Behavior

- Deleting a gear item automatically removes its specifications
- Deleting a sensor format sets the reference to null in camera specs

## Data Types & Constraints

### Numeric Precision

- **Resolution**: High precision for megapixel values
- **Focal Length**: Precise measurements in millimeters
- **Aperture**: Standard aperture scale precision

### Text Fields

- **Names & Slugs**: Limited lengths for performance
- **Search Name**: Lowercase for efficient LIKE queries and trigram searches
- **Video Resolution**: Free-form text for various format specifications

### JSONB Extra Field

The `extra` field provides flexibility for storing additional specifications without schema changes:

```json
{
  "weatherSealing": true,
  "filterThread": "67mm",
  "weight": "450g"
  // Note: dimensions moved to core `gear` table as numeric fields
}
```

## Spec Registry System

### Overview

The spec registry (`src/lib/specs/registry.tsx`) centralizes all gear specification display logic, providing a single source of truth for labels, formatting, and section organization.

### Key Benefits

- **Single Source of Truth**: All spec labels and formatting logic in one place
- **Consistent Display**: Same formatting across gear pages, compare views, and future surfaces
- **Easy Maintenance**: Adding new specs requires updating only the registry
- **Type Safety**: Uses `GearItem` type for consistent data access

### Registry Structure

The registry exports `buildGearSpecsSections(item: GearItem)` which returns `SpecsTableSection[]`. Each section contains a `data` array with label-value pairs:

```tsx
// Example registry entry
{
  label: "Resolution",
  value: cameraSpecsItem?.resolutionMp
    ? `${Number(cameraSpecsItem.resolutionMp).toFixed(1)} megapixels`
    : undefined,
},
```

### Usage

- **Gear Pages**: `buildGearSpecsSections(item)` replaces inline spec definitions
- **Compare Views**: `CompareSpecsTable` component reuses the same registry
- **Future Surfaces**: Any new spec display can import and use the registry

### Adding New Specs

1. Add field to database schema
2. Add entry to spec registry with label and formatted value
3. Field automatically appears in appropriate section

### Notes Field

- Schema: `gear.notes` (`text[]`), stores an array of strings
- Normalization: Input via edit form is validated and trimmed to `string[]` (`null` clears notes)
- UI: A "Notes" section appears at the bottom of the edit form with a repeater allowing users to add/remove note items. Each item is a textarea. Users click "+ Add note" to create a new note.
- Submission Preview: Notes are included in the confirmation modal; items are summarized inline.

## Indexing Strategy

### Performance Indexes

- **Gear Search**: Index on search name for text search
- **Type & Brand**: Composite index for filtering by gear type and brand
- **Brand & Mount**: Index for mount compatibility queries
- **Camera Sensor**: Index for sensor format lookups
- **Lens Focal**: Index for focal length range queries

### Query Optimization

Indexes are designed to support common use cases:

- Finding all cameras by a specific brand
- Searching for lenses within a focal length range
- Filtering gear by mount compatibility
- Full-text search across gear names

## Usage Examples

### Creating a Camera with Specs

```typescript
// Insert gear item
const [camera] = await db
  .insert(gear)
  .values({
    slug: "canon-eos-r5",
    searchName: "canon eos r5",
    name: "Canon EOS R5",
    gearType: "CAMERA",
    brandId: "canon-brand-id",
    mountId: "rf-mount-id",
    priceUsdCents: 389900,
  })
  .returning();

// Insert camera specifications
await db.insert(cameraSpecs).values({
  gearId: camera.id,
  sensorFormatId: "full-frame-id",
  resolutionMp: 45.0,
  isoMin: 100,
  isoMax: 51200,
  ibis: true,
  videoMaxRes: "8K RAW",
  extra: { weatherSealing: true, dualCardSlots: true },
});
```

### Querying Gear with Specs

```typescript
// Get camera with full specifications
const cameraWithSpecs = await db.query.gear.findFirst({
  where: eq(gear.slug, "canon-eos-r5"),
  with: {
    cameraSpecs: true,
    brand: true,
    mount: true,
  },
});

// Find all full-frame cameras
const fullFrameCameras = await db
  .select()
  .from(gear)
  .innerJoin(cameraSpecs, eq(gear.id, cameraSpecs.gearId))
  .innerJoin(sensorFormats, eq(cameraSpecs.sensorFormatId, sensorFormats.id))
  .where(eq(sensorFormats.slug, "full-frame"));
```

## Benefits of This Design

### 1. **Type Safety**

- Clear separation between camera and lens specifications
- Type-specific fields prevent invalid data combinations

### 2. **Flexibility**

- JSONB extra field allows for future specification additions
- Easy to add new gear types without schema changes

### 3. **Performance**

- Efficient indexing for common query patterns
- Normalized structure reduces data duplication

### 4. **Maintainability**

- Clear separation of concerns
- Easy to understand and modify

### 5. **Scalability**

- Supports large numbers of gear items
- Efficient queries with proper indexing

## Future Considerations

### Adding New Gear Types

To add a new gear type (e.g., tripods, lighting):

1. Add new enum value to `gearTypeEnum`
2. Create new specification table
3. Add relationship to `gearRelations`
4. Update application logic

### Schema Evolution

- The JSONB `extra` field provides immediate flexibility
- Major changes can be handled through migrations
- Backward compatibility maintained through careful migration planning

## Migration Notes

When deploying this schema:

1. Ensure all required indexes are created
2. Consider data migration if upgrading from a flat structure
3. Update application code to use the new relationship patterns
4. Test performance with realistic data volumes
