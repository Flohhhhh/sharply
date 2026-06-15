export const DEFAULT_OG_IMAGE_PATH = "/opengraph-image.png";

export function buildDefaultOgImageUrl(baseUrl: string) {
  return new URL(DEFAULT_OG_IMAGE_PATH, baseUrl).toString();
}
