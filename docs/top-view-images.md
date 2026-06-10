# Top- and Rear-View Images

Top-view and rear-view images provide standardized secondary reference angles alongside the primary front view.

## Schema

Stored directly on `gear` table:
- `topViewUrl` (text, nullable) - URL to the top-view image
- `rearViewUrl` (text, nullable) - URL to the rear-view image

## Audit Actions

- `GEAR_TOP_VIEW_UPLOAD` - Initial upload
- `GEAR_TOP_VIEW_REPLACE` - Replacing existing image
- `GEAR_TOP_VIEW_REMOVE` - Clearing the image
- `GEAR_REAR_VIEW_UPLOAD` - Initial upload
- `GEAR_REAR_VIEW_REPLACE` - Replacing existing image
- `GEAR_REAR_VIEW_REMOVE` - Clearing the image

## Service Functions

**Location**: `src/server/admin/gear/service.ts`

```typescript
setGearTopViewService({ gearId?, slug?, topViewUrl })
clearGearTopViewService({ gearId?, slug? })
setGearRearViewService({ gearId?, slug?, rearViewUrl })
clearGearRearViewService({ gearId?, slug? })
```

**Permissions**: MODERATOR or higher (enforced in service layer)

## Server Actions

**Location**: `src/server/admin/gear/actions.ts`

```typescript
actionSetGearTopView({ gearId?, slug?, topViewUrl })
actionClearGearTopView({ gearId?, slug? })
actionSetGearRearView({ gearId?, slug?, rearViewUrl })
actionClearGearRearView({ gearId?, slug? })
```

Revalidates `/admin/gear` after mutation.

## Display

Top-view and rear-view images appear in the gear image carousel (`gear-image-carousel.tsx`) alongside the main product image. The admin gear image modal now manages three slots in this order: front view, top view, rear view.
