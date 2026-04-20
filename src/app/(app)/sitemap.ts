import type { MetadataRoute } from "next";
import { fetchAllGearSlugs } from "~/server/gear/service";
import { BRANDS, MOUNTS } from "~/lib/generated";
import {
  getLearnPages,
  getNewsPosts,
  getReviews,
} from "~/server/payload/service";
import { getLocaleAlternates, getLocalizedUrl } from "~/i18n/routing";

export const revalidate = 3600; // Revalidate every hour

function createSitemapEntry(
  pathname: string,
  options: Omit<MetadataRoute.Sitemap[number], "url" | "alternates">,
): MetadataRoute.Sitemap[number] {
  return {
    url: getLocalizedUrl(pathname, "en"),
    alternates: {
      languages: getLocaleAlternates(pathname),
    },
    ...options,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await fetchAllGearSlugs();
  const newsPosts = await getNewsPosts();
  const publishedNewsPosts = newsPosts.filter((p) => p._status === "published");
  const learnPages = await getLearnPages();
  const publishedLearnPages = learnPages.filter(
    (p) => p._status === "published",
  );
  const reviews = await getReviews();
  const publishedReviews = reviews.filter((r) => r._status === "published");

  // TODO: add curated comparisons

  return [
    createSitemapEntry("/", {
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    }),
    createSitemapEntry("/about", {
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }),
    createSitemapEntry("/learn", {
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }),
    createSitemapEntry("/search", {
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }),
    // Reviews
    ...publishedReviews.map((review) =>
      createSitemapEntry(`/reviews/${review.slug}`, {
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.5,
      }),
    ),
    createSitemapEntry("/privacy-policy", {
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }),
    createSitemapEntry("/terms-of-service", {
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }),
    // generate brand page urls
    ...BRANDS.map((brand) =>
      createSitemapEntry(`/brand/${brand.slug}`, {
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.5,
      }),
    ),
    createSitemapEntry("/gear", {
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }),
    // generate gear page urls
    ...slugs.map((slug: string) =>
      createSitemapEntry(`/gear/${slug}`, {
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.5,
      }),
    ),
    createSitemapEntry("/news", {
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }),
    // generate news post urls
    ...publishedNewsPosts.map((post) =>
      createSitemapEntry(`/news/${post.slug}`, {
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.5,
      }),
    ),
    createSitemapEntry("/browse", {
      lastModified: new Date(),
      changeFrequency: "hourly" as const,
      priority: 0.6,
    }),
    // /browse/[brand]
    ...BRANDS.map((b) =>
      createSitemapEntry(`/browse/${b.slug}`, {
        lastModified: new Date(),
        changeFrequency: "hourly" as const,
        priority: 0.6,
      }),
    ),
    // /browse/[brand]/[category] and /browse/[brand]/[category]/[mount]
    ...BRANDS.flatMap((b) => {
      const categories: Array<"cameras" | "lenses"> = ["cameras", "lenses"];
      const brandMounts = MOUNTS.filter(
        (m) => m.brand_id === b.id && !!m.short_name,
      );
      const brandCategoryUrls = categories.map((c) =>
        createSitemapEntry(`/browse/${b.slug}/${c}`, {
          lastModified: new Date(),
          changeFrequency: "hourly" as const,
          priority: 0.6,
        }),
      );
      const mountUrls = categories.flatMap((c) =>
        brandMounts.map((m) =>
          createSitemapEntry(`/browse/${b.slug}/${c}/${String(m.short_name)}`, {
            lastModified: new Date(),
            changeFrequency: "hourly" as const,
            priority: 0.6,
          }),
        ),
      );

      return [...brandCategoryUrls, ...mountUrls];
    }),
    // Learn pages //TODO: finish feature and add to sitemap
    // Recommended lenses //TODO: finish feature and add to sitemap
  ];
}
