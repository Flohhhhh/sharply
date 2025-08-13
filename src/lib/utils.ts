import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeSearchName(name: string, brandName?: string) {
  // If no brand name provided, just normalize the gear name
  if (!brandName) {
    return name.toLowerCase().replace(/\s+/g, " ").trim();
  }

  // Check if the gear name already contains the brand name (case insensitive)
  const nameLower = name.toLowerCase();
  const brandLower = brandName.toLowerCase();

  // If brand name is already in the gear name, don't duplicate it
  if (nameLower.includes(brandLower)) {
    return nameLower.replace(/\s+/g, " ").trim();
  }

  // Otherwise, combine them
  return `${brandLower} ${nameLower}`.replace(/\s+/g, " ").trim();
}

/**
 * Converts cents to USD dollars
 * @param cents - The amount in cents
 * @returns The amount in dollars, or undefined if cents is null/undefined
 */
export function centsToUsd(
  cents: number | null | undefined,
): number | undefined {
  if (cents === null || cents === undefined) {
    return undefined;
  }
  return cents / 100;
}

/**
 * Converts USD dollars to cents
 * @param dollars - The amount in dollars
 * @returns The amount in cents, or null if dollars is undefined
 */
export function usdToCents(dollars: number | undefined): number | null {
  if (dollars === undefined) {
    return null;
  }
  return Math.round(dollars * 100);
}
