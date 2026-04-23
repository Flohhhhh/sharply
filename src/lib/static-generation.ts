import { defaultLocale } from "~/i18n/config";

const BROWSE_STATIC_CATEGORIES = ["cameras", "lenses"] as const;

type BrowseStaticBrand = {
  id: string;
  slug: string;
};

type BrowseStaticMount = {
  brand_id: string | null;
  short_name: string | null;
};

export function shouldPrebuildHeavyRouteLocale(locale: string): boolean {
  return locale === defaultLocale;
}

export function shouldPrebuildRecommendedLensesCharts(): boolean {
  return false;
}

export function buildBrowseStaticParams({
  brands,
  mounts,
  includeMountRoutes,
}: {
  brands: BrowseStaticBrand[];
  mounts: BrowseStaticMount[];
  includeMountRoutes: boolean;
}): Array<{ segments: string[] }> {
  const params: Array<{ segments: string[] }> = [{ segments: [] }];

  for (const brand of brands) {
    params.push({ segments: [brand.slug] });

    for (const category of BROWSE_STATIC_CATEGORIES) {
      params.push({ segments: [brand.slug, category] });

      if (!includeMountRoutes) {
        continue;
      }

      const brandMounts = mounts.filter(
        (mount) => mount.brand_id === brand.id && !!mount.short_name,
      );

      for (const mount of brandMounts) {
        params.push({ segments: [brand.slug, category, String(mount.short_name)] });
      }
    }
  }

  return params;
}
