# Gear View Images

Top-view, rear-view, and side-view images provide standardized secondary reference angles alongside the primary front view.
The front view can also drive a dedicated stored Open Graph asset for social embeds.

## Gear-Type Rules

- Front view (`thumbnailUrl`) applies to all gear.
- Stored OG image (`ogImageUrl`) is derived from the front view when available, using a dark 1200x630 matte with a 64px inset.
- Top view (`topViewUrl`) applies to cameras and lenses. Lens UI labels this slot as "Orthographic"; the schema name remains unchanged.
- Rear view (`rearViewUrl`) applies only to `CAMERA` and `ANALOG_CAMERA`.
- Left and right side views (`leftViewUrl`, `rightViewUrl`) apply only to `CAMERA` and `ANALOG_CAMERA`.
- Existing lens rear-view and side-view values are ignored in the UI, and those mutations for lenses are rejected in the admin service layer.
- Lens UI labels `thumbnailUrl` as "Perspective"; the schema name remains unchanged.

## Schema

Stored directly on `gear` table:
- `thumbnailUrl` (text, nullable) - URL to the front-view image
- `ogImageUrl` (text, nullable) - URL to the precomputed padded social-preview image
- `topViewUrl` (text, nullable) - URL to the top-view image
- `rearViewUrl` (text, nullable) - URL to the rear-view image
- `leftViewUrl` (text, nullable) - URL to the left-side image
- `rightViewUrl` (text, nullable) - URL to the right-side image

## OG Asset Generation

- First front-view uploads can also persist `ogImageUrl` alongside `thumbnailUrl`.
- Automatic OG generation only happens when the upload creates the first front-view image for an item.
- Replacing an existing front-view image clears `ogImageUrl`, so metadata temporarily falls back to the fresh raw thumbnail until an admin backfill or regeneration run stores a new OG asset.
- Top-view, rear-view, and side-view uploads never generate OG assets.

## Audit Actions

- `GEAR_TOP_VIEW_UPLOAD` - Initial upload
- `GEAR_TOP_VIEW_REPLACE` - Replacing existing image
- `GEAR_TOP_VIEW_REMOVE` - Clearing the image
- `GEAR_REAR_VIEW_UPLOAD` - Initial upload
- `GEAR_REAR_VIEW_REPLACE` - Replacing existing image
- `GEAR_REAR_VIEW_REMOVE` - Clearing the image
- `GEAR_LEFT_VIEW_UPLOAD` - Initial upload
- `GEAR_LEFT_VIEW_REPLACE` - Replacing existing image
- `GEAR_LEFT_VIEW_REMOVE` - Clearing the image
- `GEAR_RIGHT_VIEW_UPLOAD` - Initial upload
- `GEAR_RIGHT_VIEW_REPLACE` - Replacing existing image
- `GEAR_RIGHT_VIEW_REMOVE` - Clearing the image

## Service Functions

**Location**: `src/server/admin/gear/service.ts`

```typescript
setGearTopViewService({ gearId?, slug?, topViewUrl })
clearGearTopViewService({ gearId?, slug? })
setGearRearViewService({ gearId?, slug?, rearViewUrl })
clearGearRearViewService({ gearId?, slug? })
setGearLeftViewService({ gearId?, slug?, leftViewUrl })
clearGearLeftViewService({ gearId?, slug? })
setGearRightViewService({ gearId?, slug?, rightViewUrl })
clearGearRightViewService({ gearId?, slug? })
```

**Permissions**: Editors can upload or replace images; admins can remove images (enforced in service layer).

## Server Actions

**Location**: `src/server/admin/gear/actions.ts`

```typescript
actionSetGearTopView({ gearId?, slug?, topViewUrl })
actionClearGearTopView({ gearId?, slug? })
actionSetGearRearView({ gearId?, slug?, rearViewUrl })
actionClearGearRearView({ gearId?, slug? })
actionSetGearLeftView({ gearId?, slug?, leftViewUrl })
actionClearGearLeftView({ gearId?, slug? })
actionSetGearRightView({ gearId?, slug?, rightViewUrl })
actionClearGearRightView({ gearId?, slug? })
```

Revalidates `/admin/gear` after mutation.

## Display

Top-view, rear-view, and side-view images appear in the gear image carousel (`gear-image-carousel.tsx`) alongside the main product image. Camera and analog-camera items expose five slots in this order: front view, top view, rear view, left side, right side. Lens items expose only the front and top stored slots, labeled in the UI as perspective and orthographic.
