# Top-View Images

Top-view images show gear from above (birds-eye view) for size comparison and visual reference.

## Schema

Stored directly on `gear` table:
- `topViewUrl` (text, nullable) - URL to the top-view image

## Audit Actions

- `GEAR_TOP_VIEW_UPLOAD` - Initial upload
- `GEAR_TOP_VIEW_REPLACE` - Replacing existing image
- `GEAR_TOP_VIEW_REMOVE` - Clearing the image

## Service Functions

**Location**: `src/server/admin/gear/service.ts`

```typescript
setGearTopViewService({ gearId?, slug?, topViewUrl })
clearGearTopViewService({ gearId?, slug? })
```

**Permissions**: MODERATOR or higher (enforced in service layer)

## Server Actions

**Location**: `src/server/admin/gear/actions.ts`

```typescript
actionSetGearTopView({ gearId?, slug?, topViewUrl })
actionClearGearTopView({ gearId?, slug? })
```

Revalidates `/admin/gear` after mutation.

## Display

Top-view images appear in the gear image carousel (`gear-image-carousel.tsx`) alongside main product images. When present, they provide a standardized reference view for comparing physical dimensions across different gear.
