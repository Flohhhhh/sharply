# Image Scaling System

## Purpose

Shows camera hero images at relative physical width on the compare page using stored width data (`widthMm`) so users see size differences at a glance.

## Scope

- **Applies**: Compare page hero row only.
- **Not applied**: All other views (cards, lists, details) use standard object-contain without physical scaling.

## Data Inputs

- `widthMm` from `gear` table for each camera item.
- If missing, a neutral fallback width of 140mm is used and a warning banner is shown.

## How Scaling Works

1. Determine a shared pixels-per-millimeter constant (currently fixed at `3.0 px/mm`).
2. Compute each image’s display width in pixels: `displayWidthPx = widthMm * pxPerMm` (fallback width if missing).
3. Render the image at that width with intrinsic aspect ratio preserved (`object-fit: contain; height: auto`).
4. Add a fixed padding frame around each image so the parent container does not influence scaling.

## Components and Hooks

- `src/components/compare/use-compare-row-scale.ts`
  - Returns `pixelsPerMillimeter` (fixed) and a ref placeholder for the hero row container.
- `src/components/compare/compare-hero-scaled.tsx`
  - Accepts left/right `GearItem`.
  - Converts `widthMm` to pixel widths via the hook.
  - Renders images with a padded frame, preserving aspect ratio.
  - Shows a banner when any width is missing.
- `src/app/(app)/(pages)/(tools)/compare/page.tsx`
  - Uses `CompareHeroScaledRow` in place of the old hero images.

## Fallback Behavior

- Missing `widthMm`: use 140mm fallback, show a warning, still render.
- Missing image URL: show “Image coming soon” placeholder.

## Constraints and Notes

- Uses fixed px/mm to avoid layout thrash or resize jitter.
- Aspect ratio is always maintained (no height forcing).
- Padding is internal to the image frame and does not affect width scaling.

## Testing Tips

- Compare models with known widths (e.g., 138.5mm vs 144mm) and verify the smaller renders ~4% narrower.
- Resize the viewport: scaling remains stable because px/mm is fixed.
- Remove `widthMm` from one item to confirm the fallback banner and neutral sizing.
