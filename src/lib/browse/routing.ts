import { getMountDisplayName } from "~/lib/mapping/mounts-map";

export type GearCategorySlug = "cameras" | "lenses";

export const gearCategories: GearCategorySlug[] = ["cameras", "lenses"];

export type RouteScope = {
  brandSlug?: string;
  categorySlug?: GearCategorySlug;
  mountShort?: string;
};

export function parseSegments(segments: string[] = []): RouteScope {
  const [brandSlug, categorySlug, mountShort, extra] = segments;
  if (extra) throw new Error("Invalid route depth");
  const scope: RouteScope = {};
  if (!brandSlug) return scope;
  scope.brandSlug = brandSlug;
  if (!categorySlug) return scope;
  if (!gearCategories.includes(categorySlug as GearCategorySlug)) {
    throw new Error("Unknown category");
  }
  scope.categorySlug = categorySlug as GearCategorySlug;
  if (!mountShort) return scope;
  scope.mountShort = mountShort;
  return scope;
}

export function getDepth(scope: RouteScope): 0 | 1 | 2 | 3 {
  if (!scope.brandSlug) return 0;
  if (!scope.categorySlug) return 1;
  if (!scope.mountShort) return 2;
  return 3;
}

export function getCategoryLabel(category: GearCategorySlug): string {
  return category === "cameras" ? "Cameras" : "Lenses";
}

export function formatScopeTitle(params: {
  brandName?: string | null;
  category?: GearCategorySlug | null;
  mountValue?: string | null;
}): string {
  const brand = params.brandName?.trim() ?? "";
  const cat = params.category ?? null;
  const mount = params.mountValue ? getMountDisplayName(params.mountValue) : null;

  if (!brand && !cat) return "Browse Gear";
  if (brand && !cat) return `${brand} Gear`;
  const catLabel = getCategoryLabel(cat!);
  if (brand && cat && !mount) return `${brand} ${catLabel}`;
  if (brand && cat && mount) return `${brand} ${mount} Mount ${catLabel}`;
  return "Browse Gear";
}
