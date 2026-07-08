import { getTranslations } from "next-intl/server";
import Link from "next/link";
import {
  getBrandCategoryItems,
  type BrowseCategoryAvailability,
} from "~/lib/browse/category-availability";
import AllGearContent from "./all-gear-content";

export default async function BrandContent({
  brandSlug,
  categoryAvailability,
}: {
  brandSlug: string;
  categoryAvailability?: BrowseCategoryAvailability;
}) {
  const t = await getTranslations("browsePage");
  const items = getBrandCategoryItems({
    brandSlug,
    labels: {
      cameras: t("cameras"),
      lenses: t("lenses"),
    },
    availability: categoryAvailability,
  });
  return (
    <div className="space-y-6">
      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {items.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              className="border-border hover:bg-accent/40 group block rounded-lg border p-2 text-center sm:p-6"
            >
              <div className="text-lg font-semibold group-hover:underline sm:text-2xl">
                {i.label}
              </div>
              <div className="text-muted-foreground mt-1 text-sm">
                {t("browseCategory", { category: i.label })}
              </div>
            </Link>
          ))}
        </div>
      ) : null}
      {/* Brand-specific latest and trending */}
      <AllGearContent brandSlug={brandSlug} showBrandPicker={false} />
    </div>
  );
}
