/**
 * Nikon DX naming → image-circle coverage heuristic.
 *
 * DX-marked Nikkor lenses cover APS-C; other Nikon lenses are treated as full-frame.
 */

export type NikonImageCircleSlug = "aps-c" | "full-frame";

/** Whole-token DX match (case-insensitive), e.g. "AF-S DX NIKKOR 35mm". */
const DX_TOKEN_PATTERN = /\bDX\b/i;

export function targetImageCircleSlugFromNikonLensName(
  name: string,
): NikonImageCircleSlug {
  return DX_TOKEN_PATTERN.test(name) ? "aps-c" : "full-frame";
}
