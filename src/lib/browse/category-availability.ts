import { gearCategories,type GearCategorySlug } from "./routing";

export type BrowseCategoryCounts = Record<GearCategorySlug, number>;
export type BrowseCategoryAvailability = Record<GearCategorySlug, boolean>;

export type BrandCategoryItem = {
  category: GearCategorySlug;
  label: string;
  href: string;
};

export function getBrowseCategoryAvailability(
  counts: BrowseCategoryCounts,
): BrowseCategoryAvailability {
  return {
    cameras: counts.cameras > 0,
    lenses: counts.lenses > 0,
  };
}

export function getSingleCategoryBrandBrowseRedirectPath(params: {
  brandSlug: string;
  counts: BrowseCategoryCounts;
}): string | null {
  const availability = getBrowseCategoryAvailability(params.counts);
  const available = gearCategories.filter((category) => availability[category]);

  return available.length === 1
    ? `/browse/${params.brandSlug}/${available[0]}`
    : null;
}

export function getBrandCategoryItems(params: {
  brandSlug: string;
  labels: Record<GearCategorySlug, string>;
  availability?: BrowseCategoryAvailability;
}): BrandCategoryItem[] {
  const availability = params.availability ?? {
    cameras: true,
    lenses: true,
  };
  const items: BrandCategoryItem[] = [
    {
      category: "cameras",
      label: params.labels.cameras,
      href: `/browse/${params.brandSlug}/cameras`,
    },
    {
      category: "lenses",
      label: params.labels.lenses,
      href: `/browse/${params.brandSlug}/lenses`,
    },
  ];

  return items.filter((item) => availability[item.category]);
}
