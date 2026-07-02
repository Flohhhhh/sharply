type BrandOrderLike = {
  name: string;
  sortOrder?: number | null;
  sort_order?: number | null;
};

export function getBrandSortOrder<T extends BrandOrderLike>(
  brand: T,
): number | null {
  const value = brand.sortOrder ?? brand.sort_order ?? null;
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

export function compareBrandsWithPriority<T extends BrandOrderLike>(
  firstBrand: T,
  secondBrand: T,
): number {
  const firstSortOrder = getBrandSortOrder(firstBrand);
  const secondSortOrder = getBrandSortOrder(secondBrand);

  if (firstSortOrder !== null && secondSortOrder !== null) {
    const sortOrderDifference = firstSortOrder - secondSortOrder;
    if (sortOrderDifference !== 0) {
      return sortOrderDifference;
    }
  } else if (firstSortOrder !== null) {
    return -1;
  } else if (secondSortOrder !== null) {
    return 1;
  }

  return firstBrand.name.localeCompare(secondBrand.name);
}

export function splitBrandsWithPriority<T extends BrandOrderLike>(brands: T[]): {
  hoisted: T[];
  remaining: T[];
} {
  const sorted = [...brands].sort(compareBrandsWithPriority);
  const hoisted: T[] = [];
  const remaining: T[] = [];

  for (const brand of sorted) {
    if (getBrandSortOrder(brand) !== null) {
      hoisted.push(brand);
    } else {
      remaining.push(brand);
    }
  }

  return { hoisted, remaining };
}

export function orderBrandsWithPriority<T extends BrandOrderLike>(
  brands: T[],
): T[] {
  const { hoisted, remaining } = splitBrandsWithPriority(brands);
  return [...hoisted, ...remaining];
}
