export function supportsViewfinderEyePoint(
  viewfinderType: string | null | undefined,
): boolean {
  return Boolean(viewfinderType && viewfinderType !== "none");
}
