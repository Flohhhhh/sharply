export function shouldRevealRowActions(
  pointerType: string,
  isInteractiveTarget: boolean,
) {
  return pointerType === "touch" && !isInteractiveTarget;
}

export function buildGearEditDataUrl(
  slug: string,
  imageRequestVersion?: number,
): string {
  const baseUrl = `/api/gear/${slug}/edit-data`;
  return imageRequestVersion === undefined
    ? baseUrl
    : `${baseUrl}?request=${imageRequestVersion}`;
}
