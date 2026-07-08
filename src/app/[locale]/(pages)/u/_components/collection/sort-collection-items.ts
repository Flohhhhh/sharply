import { compareBrandsWithPriority } from "~/lib/brands";
import { getBrandById } from "~/lib/mapping/brand-map";
import type { GearItem } from "~/types/gear";

export function sortCollectionItems(items: GearItem[]) {
  const brandGroupCountsByType = getBrandGroupCountsByType(items);
  return [...items].sort((firstItem, secondItem) =>
    compareCollectionItems(firstItem, secondItem, brandGroupCountsByType),
  );
}

export function compareCollectionItems(
  firstItem: GearItem,
  secondItem: GearItem,
  brandGroupCountsByType = getBrandGroupCountsByType([firstItem, secondItem]),
) {
  const priorityDifference =
    getGearTypePriority(firstItem) - getGearTypePriority(secondItem);
  if (priorityDifference !== 0) {
    return priorityDifference;
  }

  const firstBrand = getBrandSortData(firstItem);
  const secondBrand = getBrandSortData(secondItem);
  if (!firstBrand.name && secondBrand.name) {
    return 1;
  }
  if (firstBrand.name && !secondBrand.name) {
    return -1;
  }

  const brandGroupCountDifference =
    getBrandGroupCount(secondItem, secondBrand, brandGroupCountsByType) -
    getBrandGroupCount(firstItem, firstBrand, brandGroupCountsByType);
  if (brandGroupCountDifference !== 0) {
    return brandGroupCountDifference;
  }

  const brandDifference = compareBrandsWithPriority(firstBrand, secondBrand);
  if (brandDifference !== 0) {
    return brandDifference;
  }

  const lensFocalLengthDifference = compareLensFocalLengthAscending(
    firstItem,
    secondItem,
  );
  if (lensFocalLengthDifference !== 0) {
    return lensFocalLengthDifference;
  }

  const releaseDifference = compareReleaseDateDescending(firstItem, secondItem);
  if (releaseDifference !== 0) {
    return releaseDifference;
  }

  return firstItem.name.localeCompare(secondItem.name);
}

type BrandSortData = ReturnType<typeof getBrandSortData>;
type BrandGroupCountsByType = Map<number, Map<string, number>>;

function getBrandGroupCountsByType(items: GearItem[]): BrandGroupCountsByType {
  const brandGroupCountsByType: BrandGroupCountsByType = new Map();

  for (const item of items) {
    const typePriority = getGearTypePriority(item);
    const brandData = getBrandSortData(item);
    const brandKey = getBrandGroupKey(brandData);
    const brandGroupCounts =
      brandGroupCountsByType.get(typePriority) ?? new Map<string, number>();

    brandGroupCounts.set(brandKey, (brandGroupCounts.get(brandKey) ?? 0) + 1);
    brandGroupCountsByType.set(typePriority, brandGroupCounts);
  }

  return brandGroupCountsByType;
}

function getBrandGroupCount(
  item: GearItem,
  brandData: BrandSortData,
  brandGroupCountsByType: BrandGroupCountsByType,
) {
  return (
    brandGroupCountsByType
      .get(getGearTypePriority(item))
      ?.get(getBrandGroupKey(brandData)) ?? 0
  );
}

function getBrandGroupKey(brandData: BrandSortData) {
  return brandData.name.trim().toLocaleLowerCase();
}

function compareLensFocalLengthAscending(
  firstItem: GearItem,
  secondItem: GearItem,
) {
  if (!isLens(firstItem) || !isLens(secondItem)) {
    return 0;
  }

  const firstFocalLength = getLensSortFocalLength(firstItem);
  const secondFocalLength = getLensSortFocalLength(secondItem);

  if (firstFocalLength === null && secondFocalLength === null) {
    return 0;
  }

  if (firstFocalLength === null) {
    return 1;
  }

  if (secondFocalLength === null) {
    return -1;
  }

  return firstFocalLength - secondFocalLength;
}

function getLensSortFocalLength(item: GearItem) {
  return (
    parseNumericSortValue(item.lensSpecs?.focalLengthMinMm) ??
    parseNumericSortValue(item.lensSpecs?.focalLengthMaxMm)
  );
}

function parseNumericSortValue(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  const numericValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function getBrandSortData(item: GearItem) {
  const directBrandName = item.brands?.name?.trim();
  if (directBrandName) {
    return {
      name: directBrandName,
      sortOrder: item.brands?.sortOrder ?? null,
    };
  }

  const mappedBrand = item.brandId ? getBrandById(item.brandId) : undefined;
  return {
    name: mappedBrand?.name?.trim() ?? "",
    sortOrder: mappedBrand?.sortOrder ?? null,
  };
}

function compareReleaseDateDescending(firstItem: GearItem, secondItem: GearItem) {
  const firstReleaseTimestamp = getReleaseTimestamp(firstItem);
  const secondReleaseTimestamp = getReleaseTimestamp(secondItem);

  if (firstReleaseTimestamp === null && secondReleaseTimestamp === null) {
    return 0;
  }

  if (firstReleaseTimestamp === null) {
    return 1;
  }

  if (secondReleaseTimestamp === null) {
    return -1;
  }

  return secondReleaseTimestamp - firstReleaseTimestamp;
}

function getGearTypePriority(item: GearItem) {
  const gearTypeIdentifier = item.gearType?.toUpperCase() ?? "";
  if (
    gearTypeIdentifier === "CAMERA" ||
    gearTypeIdentifier === "ANALOG_CAMERA"
  ) {
    return 0;
  }

  if (gearTypeIdentifier === "LENS") {
    return 1;
  }

  return 2;
}

function isLens(item: GearItem) {
  return item.gearType?.toUpperCase() === "LENS";
}

function getReleaseTimestamp(item: GearItem) {
  const releaseValue = item.releaseDate;
  if (!releaseValue) {
    return null;
  }

  const parsedDate =
    releaseValue instanceof Date ? releaseValue : new Date(releaseValue);
  const timeValue = parsedDate.getTime();
  if (Number.isNaN(timeValue)) {
    return null;
  }

  return timeValue;
}
