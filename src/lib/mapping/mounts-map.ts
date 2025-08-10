/**
 * Mount mapping from database values to readable display names
 * Simply removes everything after the dash and uppercases the result
 */

/**
 * Get the short display name for a mount value
 * @param mountValue - The database mount value (e.g., "z-nikon")
 * @returns The short display name (e.g., "Z") or the original value if no mapping exists
 */
export function getMountDisplayName(
  mountValue: string | null | undefined,
): string {
  if (!mountValue) return "Unknown";

  // Remove everything after the dash and uppercase
  const displayName = mountValue.split("-")[0]?.toUpperCase();
  return displayName || mountValue;
}

/**
 * Get the long display name for a mount value
 * @param mountValue - The database mount value (e.g., "z-nikon")
 * @returns The long display name (e.g., "Z - Nikon") or the original value if no mapping exists
 */
export function getMountLongName(
  mountValue: string | null | undefined,
): string {
  if (!mountValue) return "Unknown";

  const parts = mountValue.split("-");
  if (parts.length < 2) return mountValue;

  const mount = parts[0]?.toUpperCase();
  const brand = parts[1];

  if (!mount || !brand) return mountValue;

  const formattedBrand = brand.charAt(0).toUpperCase() + brand.slice(1);
  return `${mount} - ${formattedBrand}`;
}
