const DEFAULT_HOISTED_BRANDS = [
  "Canon",
  "Nikon",
  "Sony",
  "Fujifilm",
  "Leica",
  "Hasselblad",
  "Sigma",
  "Tamron",
];

/**
 * Returns brands ordered with priority names first (in the given order) and
 * the remaining brands sorted alphabetically. Also returns the separated
 * groups so callers can insert a visual divider.
 */
export function splitBrandsWithPriority<T extends { name: string }>(
  brands: T[],
  priorityNames: string[] = DEFAULT_HOISTED_BRANDS,
): { hoisted: T[]; remaining: T[] } {
  const priorityMap = new Map<string, number>();
  priorityNames.forEach((name, index) =>
    priorityMap.set(name.toLowerCase(), index),
  );

  const sorted = [...brands].sort((a, b) => a.name.localeCompare(b.name));
  const hoisted: T[] = [];
  const remaining: T[] = [];

  for (const brand of sorted) {
    const key = brand.name.toLowerCase();
    if (priorityMap.has(key)) {
      hoisted.push(brand);
    } else {
      remaining.push(brand);
    }
  }

  hoisted.sort(
    (a, b) =>
      (priorityMap.get(a.name.toLowerCase()) ?? 0) -
      (priorityMap.get(b.name.toLowerCase()) ?? 0),
  );

  return { hoisted, remaining };
}

export function orderBrandsWithPriority<T extends { name: string }>(
  brands: T[],
  priorityNames: string[] = DEFAULT_HOISTED_BRANDS,
): T[] {
  const { hoisted, remaining } = splitBrandsWithPriority(brands, priorityNames);
  return [...hoisted, ...remaining];
}

export const HOISTED_BRANDS = DEFAULT_HOISTED_BRANDS;
