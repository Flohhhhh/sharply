import { parseBhProductUrl, normalizeBhProductLink } from "~/lib/validation/bhphoto";

/**
 * Normalize and return the B&H destination URL. Throws if invalid.
 */
export function getBhDestinationUrl(rawUrl: string): string {
  const destination =
    normalizeBhProductLink(rawUrl) ?? parseBhProductUrl(rawUrl);
  if (!destination) {
    throw new Error("Invalid B&H URL");
  }
  return destination;
}

