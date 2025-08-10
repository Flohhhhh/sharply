# Mapping System Technical Overview

## Overview

The mapping system provides utilities to convert database values into human-readable display names. It's designed to be simple, maintainable, and type-safe.

## Architecture

```
src/lib/mapping/
├── index.ts              # Main export file
├── mounts-map.ts         # Mount type transformations
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
