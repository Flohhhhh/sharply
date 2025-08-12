# Constants Generation

This system automatically generates TypeScript constants from database tables, providing type-safe access to static data without runtime database calls.

## How It Works

1. **Database Source**: Constants are pulled from tables like `mounts`, `sensorFormats`, and `brands`
2. **Build-time Generation**: The `generate-constants` script runs during development/build
3. **Type Safety**: Generated constants include full TypeScript types
4. **Performance**: No runtime database queries for static data

## Usage

### Generate Constants

```bash
npm run constants:generate
```

This will create:

- `src/lib/constants/generated.ts` - Single file with all constants and types

### Import Constants

```typescript
import { MOUNTS, SENSOR_FORMATS, BRANDS } from "~/lib/constants";

// Type-safe access
const rfMount = MOUNTS.find((m) => m.id === "rf-mount");
const mountIds: MountId[] = MOUNTS.map((m) => m.id);
```

### Available Types

- `MountId` - Union type of all mount IDs
- `Mount` - Full mount object type
- `SensorFormatId` - Union type of all sensor format IDs
- `SensorFormat` - Full sensor format object type
- `BrandId` - Union type of all brand IDs
- `Brand` - Full brand object type

## When to Regenerate

- After database migrations that change these tables
- When adding new mounts, sensor formats, or brands
- Before deploying to ensure constants are up-to-date

## Benefits

- **Type Safety**: Compile-time validation of IDs and values
- **Performance**: No runtime database calls for static data
- **Developer Experience**: Autocomplete and IntelliSense
- **Consistency**: Single source of truth in database
- **Maintainability**: Automatic updates when database changes
- **Simplicity**: Single generated file instead of multiple files

## Future Enhancements

- Add to build pipeline for automatic generation
- Support for more table types (gear categories, etc.)
- Validation that generated constants match schema
