/**
 * Mount mapping from database values to readable display names
 * Simply removes everything after the dash and uppercases the result
 */

import { MOUNTS } from "~/lib/constants";
import type { Mount } from "~/types/gear";

type MountConst = Pick<Mount, "id"> & { value: string };
const MOUNT_LIST = MOUNTS as MountConst[];

/**
 * Get the short display name for a mount value
 * @param mountValue - The database mount value (e.g., "z-nikon")
 * @returns The short display name (e.g., "Z") or the original value if no mapping exists
 */
export function getMountDisplayName(
  mountValue: string | null | undefined,
): string {
  if (!mountValue) return "Unknown";
  if (mountValue === "ef-m-canon") return "EF-M";

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
  if (mountValue === "ef-m-canon") return "EF-M - Canon";
  const parts = mountValue.split("-");
  if (parts.length < 2) return mountValue;

  const mount = parts[0]?.toUpperCase();
  const brand = parts[1];

  if (!mount || !brand) return mountValue;

  const formattedBrand = brand.charAt(0).toUpperCase() + brand.slice(1);
  return `${mount} - ${formattedBrand}`;
}

/**
 * Get a readable display name for a mount by its database id
 */
export function getMountNameById(mountId: string | null | undefined): string {
  if (!mountId) return "Unknown";
  const m = MOUNT_LIST.find((x) => x.id === mountId);
  if (!m) return mountId;
  return getMountDisplayName(m.value);
}

/**
 * Get the long display name for a mount by its database id
 */
export function getMountLongNameById(
  mountId: string | null | undefined,
): string {
  if (!mountId) return "Unknown";
  const m = MOUNT_LIST.find((x) => x.id === mountId);
  if (!m) return mountId;
  return getMountLongName(m.value);
}

/**
 * Get display names for multiple mount IDs (comma-separated)
 */
export function getMountNamesById(
  mountIds: string[] | null | undefined,
): string {
  if (!mountIds || mountIds.length === 0) return "Unknown";
  return mountIds
    .map((id) => getMountNameById(id))
    .filter((n) => n !== "Unknown")
    .join(", ");
}

/**
 * Get long display names for multiple mount IDs (comma-separated)
 */
export function getMountLongNamesById(
  mountIds: string[] | null | undefined,
): string {
  if (!mountIds || mountIds.length === 0) return "Unknown";
  return mountIds
    .map((id) => getMountLongNameById(id))
    .filter((n) => n !== "Unknown")
    .join(", ");
}
