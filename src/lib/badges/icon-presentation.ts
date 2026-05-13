export type BadgeIconPresentation = "fill" | "stroke";

/**
 * Lucide icons on badge tiles use either a solid fill (default) or outline stroke.
 * Omit `presentation` to keep the historical filled look.
 */
export function getBadgeIconSvgProps(
  presentation?: BadgeIconPresentation,
): { fill: string; stroke?: string } {
  if (presentation === "stroke") {
    return { fill: "none", stroke: "currentColor" };
  }
  return { fill: "currentColor" };
}
