# Mapping System Technical Overview

## Overview

The mapping system provides utilities to convert database values into human-readable display names. It's designed to be simple, maintainable, and type-safe.

## Architecture

```
src/lib/mapping/
├── index.ts              # Main export file
├── mounts-map.ts         # Mount type transformations
├── lens-aperture-map.ts  # Aperture formatting (new)
└── price-map.ts          # Price formatting utilities
```

## Core Functions

### Mount Mappings (`mounts-map.ts`)

#### `getMountDisplayName(mountValue: string | null | undefined): string`

- **Purpose**: Converts mount values to short, compact display names
- **Logic**: Splits on dash, takes first part, uppercases
- **Examples**:
  - `"z-nikon"` → `"Z"`
  - `"rf-canon"` → `"RF"`
  - `"e-sony"` → `"E"`

#### `getMountLongName(mountValue: string | null | undefined): string`

- **Purpose**: Converts mount values to descriptive, full names
- **Logic**: Splits on dash, formats as "MOUNT - Brand"
- **Examples**:
  - `"z-nikon"` → `"Z - Nikon"`
  - `"rf-canon"` → `"RF - Canon"`
  - `"e-sony"` → `"E - Sony"`

### Price Formatting (`price-map.ts`)

#### `formatPrice(priceCents: number | null | undefined): string`

- **Purpose**: Converts price in cents to readable currency string
- **Logic**: Divides by 100, formats with dollar sign and locale-aware number formatting
- **Examples**:
  - `324900` → `"$3,249.00"`
  - `159695` → `"$1,596.95"`

## Usage Patterns

### Basic Import

```typescript
import {
  getMountDisplayName,
  getMountLongName,
  formatPrice,
  formatApertureRange,
  formatLensApertureDisplay,
} from "~/lib/mapping";
```

### Mount Display Examples

```typescript
// Compact display (badges, labels)
<span>{getMountDisplayName(item.mount)}</span>

// Detailed display (tooltips, descriptions)
<span>{getMountLongName(item.mount)}</span>
```

### Price Display Examples

```typescript
// Simple price formatting
<div>{formatPrice(item.priceUsdCents)}</div>
```

### Lens Aperture Formatting (`lens-aperture-map.ts`)

#### `formatApertureRange(wide: number | null | undefined, tele: number | null | undefined): string`

- **Purpose**: Formats a single or variable aperture as `f/2.8` or `f/5.6 - 6.3`
- **Logic**: Trims trailing `.00` and unnecessary zeros; collapses equal ends to single
- **Examples**:
  - `(2.8, null)` → `"f/2.8"`
  - `(5.6, 6.3)` → `"f/5.6 - 6.3"`
  - `(4, 4)` → `"f/4"`

#### `formatLensApertureDisplay({ maxApertureWide, maxApertureTele, minApertureWide, minApertureTele })`

- **Purpose**: Returns `{ maxText, minText }` for "Maximum Aperture" and "Minimum Aperture" lines
- **Examples**:
  - `{ maxApertureWide: 4.5, minApertureWide: 16 }`
    → `{ maxText: "f/4.5", minText: "f/16" }`
  - `{ maxApertureWide: 5.6, maxApertureTele: 6.3, minApertureWide: 16, minApertureTele: 22 }`
    → `{ maxText: "f/5.6 - 6.3", minText: "f/16 - 22" }`

## Design Principles

1. **Simple Logic**: No hardcoded mappings - uses string manipulation
2. **Null Safety**: Handles null/undefined values gracefully
3. **Type Safety**: Full TypeScript support with proper interfaces
4. **Consistent API**: Similar function signatures across all mappers
5. **Fallback Behavior**: Returns original value if transformation fails

## Extensibility

To add new mapping types:

1. Create new mapping file (e.g., `lens-types-map.ts`)
2. Implement transformation functions
3. Export from `index.ts`
4. Update `getDisplayName()` utility function

## Error Handling

- **Null/undefined inputs**: Return "Unknown"
- **Malformed strings**: Return original value
- **Missing parts**: Graceful fallback to original value

## Performance Considerations

- **Lightweight**: Simple string operations, no complex lookups
- **No caching**: Functions are pure and stateless
- **Minimal dependencies**: Only uses built-in JavaScript methods
