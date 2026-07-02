import { compareBrandsWithPriority } from "~/lib/brands";
import { getBrandById } from "~/lib/mapping/brand-map";
import type { GearItem } from "~/types/gear";

export function sortCollectionItems(items: GearItem[]) {
  return [...items].sort(compareCollectionItems);
}

export function compareCollectionItems(firstItem: GearItem, secondItem: GearItem) {
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

  const brandDifference = compareBrandsWithPriority(firstBrand, secondBrand);
  if (brandDifference !== 0) {
    return brandDifference;
  }

  const releaseDifference = compareReleaseDateDescending(firstItem, secondItem);
  if (releaseDifference !== 0) {
    return releaseDifference;
  }

  return firstItem.name.localeCompare(secondItem.name);
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
