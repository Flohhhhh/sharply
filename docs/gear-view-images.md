# Gear View Images

Top-view, rear-view, and side-view images provide standardized secondary reference angles alongside the primary front view.
The front view can also drive a dedicated stored Open Graph asset for social embeds.

## Gear-Type Rules

- Front view (`thumbnailUrl`) applies to all gear.
- Public gear cards and social metadata use the front view first. For lenses
  only, `topViewUrl` (the orthographic view) is the fallback when no front view
  exists. Camera top/rear/side images are never card-image fallbacks.
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
- For lenses without a front view, the first orthographic upload can persist a
  padded `ogImageUrl` derived from `topViewUrl`.
- Replacing an existing front-view image clears `ogImageUrl`, so metadata temporarily falls back to the fresh raw thumbnail until an admin backfill or regeneration run stores a new OG asset.
- Replacing or removing a lens orthographic image while no front view exists
  clears the stored OG asset; a replacement upload regenerates it after the
  image is saved.
- Camera top-view, rear-view, and side-view uploads never generate OG assets.

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

## Upload review

Gear image blobs are uploaded directly to UploadThing first, then reviewed on the server before their URL is written to `gear` or `gear_colorways`. Editor mutations accept only recognized UploadThing delivery URLs, preventing a direct action call from making the server fetch an arbitrary URL.

`src/server/gear-image-review/service.ts` owns the ordered check registry. Editors run each registered check; admins and superadmins skip the pipeline. The baseline check downloads the uploaded image with `sharp`, applies a 10-second deadline and 4 MB response limit, and requires a longest edge of at least 800px. It returns `IMAGE_TOO_SMALL`, which the upload UI renders as: “This image is too small. Upload an image at least 800px on the long edge; 1000px on the long edge is ideal.” A blocking check prevents the mutation and the review service attempts to delete the unreferenced UploadThing blob. Review always completes before the data update, so a failed replacement leaves the existing image untouched. Derived OG assets are created only after the primary image passes review and is stored.

The second registered check, `llmImageReviewCheck`, calls the single server-only entry point `reviewGearImageWithLlm`. When `OPENROUTER_API_KEY` is absent it passes automatically, so local contributors do not need credentials. With a key, it calls OpenRouter with `google/gemini-2.5-flash-lite` by default; `GEAR_IMAGE_REVIEW_MODEL` can override that model without changing code.

The LLM receives the new UploadThing URL as an image input and returns strict JSON with a pass/block decision, 0–100 confidence, and a stable reason code. Any `block` decision rejects the upload; confidence is retained for diagnostics. The check blocks clear obscenity/sexual content, unsafe or inappropriate content, images that are not camera gear, or clearly suspicious content. It deliberately does not distinguish camera from lens or identify an exact model; if camera gear cannot be determined as the primary subject, it blocks the image. OpenRouter calls have a 10-second deadline. Provider errors, invalid model output, and inaccessible image URLs block the upload; an insufficient-credit (`402`) response passes automatically so exhausted optional AI usage does not stop contributors.

### Adding a review check

Implement `GearImageReviewCheck` and add it to `gearImageReviewChecks` in the desired order. Checks run serially and stop at the first block, so put inexpensive structural checks before network or model calls.

```typescript
const productImageCheck: GearImageReviewCheck = async (context) => {
  const response = await fetch(context.imageUrl, { cache: "no-store" });
  if (!response.ok) {
    return { status: "blocked", reason: "IMAGE_UNREADABLE" };
  }

  const imageBytes = await response.arrayBuffer();
  const verdict = await classifyGearImage({
    imageBytes,
    imageType: context.imageType,
  });

  return verdict.approved
    ? { status: "passed" }
    : { status: "blocked", reason: "IMAGE_DOES_NOT_MATCH_GEAR" };
};

export const gearImageReviewChecks: readonly GearImageReviewCheck[] = [
  minimumImageLongEdgeCheck,
  llmImageReviewCheck,
  productImageCheck,
];
```

The check receives a `GearImageReviewContext` containing the authenticated actor, `gearId`, target `imageType`, and the newly uploaded UploadThing `imageUrl`. UploadThing has already stored the blob at this point, but the URL has not been attached to a gear or colorway record. A check can pass that URL directly to a vision provider that supports URL inputs, or download the image bytes as in the example and send those bytes to the provider. Do not use a client-supplied verdict as an enforcement decision.

Checks must return one of these exact result shapes:

```typescript
{ status: "passed" }
{ status: "blocked", reason: "STABLE_REASON_CODE" }
```

A passed result advances to the next check; when every check passes, the image mutation proceeds and editors receive the existing success feedback. A blocked result stops all later checks, keeps the old image in place during replacement, attempts to delete the new unreferenced UploadThing blob, and returns a serializable rejection result to the action caller so the modal can reliably show its localized callout and long-lived toast in production. `reason` is a stable machine-readable code; add a matching localized UI message when introducing a reason that needs specific editor feedback. Do not put provider errors, prompts, or sensitive diagnostic data in it.

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
