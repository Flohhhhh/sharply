import { BRANDS } from "../constants";

export function getBrandNameById(id: string) {
  const brand = BRANDS.find((b) => b.id === id);
  return brand?.name;
}

// Escapes a string for safe use inside a RegExp
export function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Removes a leading brand token from a full gear name (case-insensitive)
export function stripLeadingBrand(fullName: string, brandName: string): string {
  if (!fullName || !brandName) return fullName;
  const re = new RegExp(`^\\s*${escapeRegExp(brandName)}\\s+`, "i");
  return fullName.replace(re, "").trim();
}

// Utility to split a full name into brand and model using a brandId lookup
export function splitBrandAndModel(
  name: string | null | undefined,
  brandId: string | null | undefined,
  fallback: string,
): { brand: string; model: string } {
  const brand = (getBrandNameById(brandId ?? "") ?? "").trim();
  const fullName = name ?? fallback;
  const model = stripLeadingBrand(fullName, brand);
  return { brand, model };
}
