export type GearDisplayImageInput = {
  gearType?: string | null;
  thumbnailUrl?: string | null;
  topViewUrl?: string | null;
};

/**
 * Resolve the image used for public gear cards and social previews.
 *
 * Lenses can use their orthographic image when no perspective/front image is
 * available. Camera top views remain secondary images and are not fallbacks.
 */
export function getGearDisplayImageUrl(
  gear: GearDisplayImageInput,
): string | null {
  const thumbnailUrl = gear.thumbnailUrl?.trim();
  if (thumbnailUrl) return thumbnailUrl;

  if (gear.gearType === "LENS") {
    const topViewUrl = gear.topViewUrl?.trim();
    if (topViewUrl) return topViewUrl;
  }

  return null;
}
