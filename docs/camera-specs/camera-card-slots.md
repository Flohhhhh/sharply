# Camera Card Slots: Enums & Table Overview

## Enums

_See [`src/server/db/schema.ts`](../../src/server/db/schema.ts)_

- **`cardFormFactorEnum`**: Enumerates physical card formats (e.g., `"sd"`, `"cfexpress_type_a"`, `"xqd"`, legacy types, etc.).
- **`cardBusEnum`**: Enumerates electrical interface/bus types supported by card slots (e.g., `"uhs_ii"`, `"cfexpress_pcie_gen3x2"`, `"cfast_sata_iii"`, etc.).
- **`cardSpeedClassEnum`**: Enumerates speed/performance ratings (e.g., `"c10"`, `"u3"`, `"v90"`, `"vpg_130"`, etc.).

These enums describe the physical and electrical capabilities of each card slot in a camera.

---

## Table: `camera_card_slots`

_See [`src/server/db/schema.ts`](../../src/server/db/schema.ts)_

The `camera_card_slots` table specifies the card slots for each **camera gear item** (from the `gear` table, where `gear_type = "CAMERA"`). Each row represents a single slot for a camera.

| Column                  | Description                                                              |
| ----------------------- | ------------------------------------------------------------------------ |
| `id`                    | Primary key for the slot row.                                            |
| `gearId`                | References the camera (gear item).                                       |
| `slotIndex`             | Indicates which slot (1, 2, ...) this row describes for the camera.      |
| `supportedFormFactors`  | Array of supported card form factors (from `cardFormFactorEnum`).        |
| `supportedBuses`        | Array of supported bus types (from `cardBusEnum`).                       |
| `supportedSpeedClasses` | (Optional) Array of supported speed classes (from `cardSpeedClassEnum`). |
| `notes`                 | Freeform notes about the slot.                                           |
| `createdAt`             | Timestamp when the row was created.                                      |
| `updatedAt`             | Timestamp when the row was last updated.                                 |

Each camera can have multiple slots, each described by a row in this table. This structure allows modeling of cameras with multiple, potentially heterogeneous card slots (e.g., "Slot 1: SD UHS-II, Slot 2: CFexpress Type B").

> **Note:** This table is only used for cameras (not lenses or other gear types).
