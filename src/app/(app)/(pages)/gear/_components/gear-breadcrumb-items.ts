import type { CrumbItem } from "~/components/layout/breadcrumbs";
import { getCategoryLabel, type GearCategorySlug } from "~/lib/browse/routing";
import {
  getMountById,
  getMountNameById,
  getMountShortNameById,
} from "~/lib/mapping/mounts-map";

type GearBreadcrumbInput = {
  brandId?: string | null;
  brandName?: string | null;
  brandSlug?: string | null;
  gearType?: string | null;
  mountId?: string | null;
  mountIds?: string[] | null;
};

function getBrowseCategory(
  gearType: string | null | undefined,
): GearCategorySlug | null {
  if (gearType === "LENS") return "lenses";
  if (gearType === "CAMERA" || gearType === "ANALOG_CAMERA") return "cameras";
  return null;
}

function getPrimaryMountId(
  input: Pick<GearBreadcrumbInput, "mountId" | "mountIds">,
) {
  if (input.mountId) return input.mountId;
  return input.mountIds?.find(Boolean) ?? null;
}

function hasMultipleMounts(
  mountIds: GearBreadcrumbInput["mountIds"],
): boolean {
  if (!mountIds?.length) return false;
  return new Set(mountIds.filter(Boolean)).size > 1;
}

function isNativeMountForBrand(
  mountId: string | null,
  brandId: string | null | undefined,
): boolean {
  if (!mountId || !brandId) return false;
  return getMountById(mountId)?.brand_id === brandId;
}

export function buildGearBreadcrumbItems(
  input: GearBreadcrumbInput,
): CrumbItem[] {
  const items: CrumbItem[] = [{ label: "Gear", href: "/browse" }];
  const brandName = input.brandName?.trim();
  const brandSlug = input.brandSlug?.trim();

  if (!brandName || !brandSlug) {
    return items;
  }

  items.push({
    label: brandName,
    href: `/browse/${brandSlug}`,
  });

  const category = getBrowseCategory(input.gearType);
  if (!category) {
    return items;
  }

  const categoryLabel = getCategoryLabel(category);
  const primaryMountId = getPrimaryMountId(input);
  const mountShortName = primaryMountId
    ? getMountShortNameById(primaryMountId)
    : null;
  const includeMountBreadcrumb =
    !!mountShortName &&
    !!primaryMountId &&
    !hasMultipleMounts(input.mountIds) &&
    isNativeMountForBrand(primaryMountId, input.brandId);

  if (!includeMountBreadcrumb) {
    items.push({
      label: categoryLabel,
      href: `/browse/${brandSlug}/${category}`,
    });
    return items;
  }

  items.push({
    label: `${getMountNameById(primaryMountId)} ${categoryLabel}`,
    href: `/browse/${brandSlug}/${category}/${mountShortName}`,
  });

  return items;
}
