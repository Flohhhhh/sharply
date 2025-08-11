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
