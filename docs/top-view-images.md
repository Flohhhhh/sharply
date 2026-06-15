# Top- and Rear-View Images

Top-view and rear-view images provide standardized secondary reference angles alongside the primary front view.
The front view can also drive a dedicated stored Open Graph asset for social embeds.

## Gear-Type Rules

- Front view (`thumbnailUrl`) applies to all gear.
- Stored OG image (`ogImageUrl`) is derived from the front view when available.
- Top view (`topViewUrl`) applies to cameras and lenses.
- Rear view (`rearViewUrl`) applies only to `CAMERA` and `ANALOG_CAMERA`.
- Existing lens rear-view values are ignored in the UI, and rear-view mutations for lenses are rejected in the admin service layer.

## Schema

Stored directly on `gear` table:
- `thumbnailUrl` (text, nullable) - URL to the front-view image
- `ogImageUrl` (text, nullable) - URL to the precomputed padded social-preview image
- `topViewUrl` (text, nullable) - URL to the top-view image
- `rearViewUrl` (text, nullable) - URL to the rear-view image

## OG Asset Generation

- First front-view uploads can also persist `ogImageUrl` alongside `thumbnailUrl`.
- Automatic OG generation only happens when the upload creates the first front-view image for an item.
- Replacing an existing front-view image clears `ogImageUrl`, so metadata temporarily falls back to the fresh raw thumbnail until an admin backfill or regeneration run stores a new OG asset.
- Top-view and rear-view uploads never generate OG assets.

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

Top-view and rear-view images appear in the gear image carousel (`gear-image-carousel.tsx`) alongside the main product image. Camera and analog-camera items expose three slots in this order: front view, top view, rear view. Lens items expose only front view and top view.
