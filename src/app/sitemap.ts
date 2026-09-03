import type { MetadataRoute } from "next";
import { getLocaleAlternates, getLocalizedUrl } from "~/i18n/routing";
import { BRANDS, MOUNTS } from "~/lib/generated";
import { fetchGearSitemapEntries } from "~/server/gear/service";
import {
  getLearnPages,
  getNewsPosts,
  getReviews,
} from "~/server/payload/service";
import { fetchTagSitemapEntries } from "~/server/tags/service";

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

/**
 * lastModified is only set from real content timestamps. Static pages omit
 * it — stamping every URL with the generation time teaches crawlers to
 * distrust the field entirely.
 */
function toLastModified(
  value: Date | string | null | undefined,
): Date | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const gearEntries = await fetchGearSitemapEntries();
  const tagEntries = await fetchTagSitemapEntries();
  const newsPosts = await getNewsPosts();
  const publishedNewsPosts = newsPosts.filter((p) => p._status === "published");
  const learnPages = await getLearnPages();
  const publishedLearnPages = learnPages.filter(
    (page) => page._status === "published" && !!page.slug,
  );
  const reviews = await getReviews();
  const publishedReviews = reviews.filter((r) => r._status === "published");

  // TODO: add curated comparisons

  return [
    createSitemapEntry("/", {
      changeFrequency: "daily" as const,
      priority: 1,
    }),
    createSitemapEntry("/about", {
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }),
    createSitemapEntry("/contact", {
      changeFrequency: "monthly" as const,
      priority: 0.4,
    }),
    createSitemapEntry("/learn", {
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }),
    createSitemapEntry("/learn/basics", {
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }),
    createSitemapEntry("/search", {
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }),
    createSitemapEntry("/reviews", {
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }),
    // Reviews
    ...publishedReviews.map((review) =>
      createSitemapEntry(`/reviews/${review.slug}`, {
        lastModified: toLastModified(review.updatedAt),
        changeFrequency: "weekly" as const,
        priority: 0.5,
      }),
    ),
    createSitemapEntry("/privacy-policy", {
      changeFrequency: "monthly" as const,
      priority: 0.3,
    }),
    createSitemapEntry("/terms-of-service", {
      changeFrequency: "monthly" as const,
      priority: 0.3,
    }),
    // Tools
    createSitemapEntry("/compare", {
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }),
    createSitemapEntry("/exif-viewer", {
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }),
    createSitemapEntry("/focal-length-reference", {
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }),
    createSitemapEntry("/instagram-post-builder", {
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }),
    // Lists
    createSitemapEntry("/lists/hall-of-fame", {
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }),
    createSitemapEntry("/lists/trending", {
      changeFrequency: "daily" as const,
      priority: 0.6,
    }),
    // generate gear page urls
    ...gearEntries.map((entry) =>
      createSitemapEntry(`/gear/${entry.slug}`, {
        lastModified: toLastModified(entry.updatedAt),
        changeFrequency: "weekly" as const,
        priority: 0.5,
      }),
    ),
    createSitemapEntry("/news", {
      changeFrequency: "daily" as const,
      priority: 0.6,
    }),
    // generate news post urls
    ...publishedNewsPosts.map((post) =>
      createSitemapEntry(`/news/${post.slug}`, {
        lastModified: toLastModified(post.updatedAt),
        changeFrequency: "monthly" as const,
        priority: 0.5,
      }),
    ),
    createSitemapEntry("/browse", {
      changeFrequency: "daily" as const,
      priority: 0.6,
    }),
    // /browse/[brand]
    ...BRANDS.map((b) =>
      createSitemapEntry(`/browse/${b.slug}`, {
        changeFrequency: "daily" as const,
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
          changeFrequency: "daily" as const,
          priority: 0.6,
        }),
      );
      const mountUrls = categories.flatMap((c) =>
        brandMounts.map((m) =>
          createSitemapEntry(`/browse/${b.slug}/${c}/${String(m.short_name)}`, {
            changeFrequency: "daily" as const,
            priority: 0.6,
          }),
        ),
      );

      return [...brandCategoryUrls, ...mountUrls];
    }),
    ...publishedLearnPages.map((page) =>
      createSitemapEntry(`/learn/${page.slug}`, {
        lastModified: toLastModified(page.updatedAt),
        changeFrequency: "monthly" as const,
        priority: 0.5,
      }),
    ),
    // Tag hub pages
    ...tagEntries.map((tag) =>
      createSitemapEntry(`/tags/${tag.slug}`, {
        lastModified: toLastModified(tag.updatedAt),
        changeFrequency: "weekly" as const,
        priority: 0.5,
      }),
    ),
    // Recommended lenses //TODO: finish feature and add to sitemap
  ];
}
