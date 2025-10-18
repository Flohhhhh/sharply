import type { MetadataRoute } from "next";
import { fetchAllGearSlugs } from "~/server/gear/service";
import { BRANDS, MOUNTS } from "~/lib/generated";
import { getNewsPosts } from "~/lib/directus";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await fetchAllGearSlugs();
  const newsPosts = await getNewsPosts();
  return [
    {
      url: "https://sharplyphoto.com",
      lastModified: new Date(),
      changeFrequency: "hourly" as const,
      priority: 1,
    },
    {
      url: "https://sharplyphoto.com/about",
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: "https://sharplyphoto.com/learn",
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    },
    {
      url: "https://sharplyphoto.com/search",
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    },
    // {
    //   url: "https://sharplyphoto.com/focal-simulator",
    //   lastModified: new Date(),
    //   changeFrequency: "weekly" as const,
    //   priority: 0.5,
    // },
    {
      url: "https://sharplyphoto.com/privacy-policy",
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    },
    {
      url: "https://sharplyphoto.com/terms-of-service",
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    },
    // generate brand page urls
    ...BRANDS.map((brand) => ({
      url: `https://sharplyphoto.com/brand/${brand.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
    {
      url: "https://sharplyphoto.com/gear",
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    },
    // generate gear page urls
    ...slugs.map((slug: string) => ({
      url: `https://sharplyphoto.com/gear/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
    {
      url: "https://sharplyphoto.com/news",
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    },
    // generate news post urls
    ...newsPosts.map((post) => ({
      url: `https://sharplyphoto.com/news/${post.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
    // generate browse page urls
    {
      url: `https://sharplyphoto.com/browse`,
      lastModified: new Date(),
      changeFrequency: "hourly" as const,
      priority: 0.6,
    },
    // /browse/[brand]
    ...BRANDS.map((b) => ({
      url: `https://sharplyphoto.com/browse/${b.slug}`,
      lastModified: new Date(),
      changeFrequency: "hourly" as const,
      priority: 0.6,
    })),
    // /browse/[brand]/[category] and /browse/[brand]/[category]/[mount]
    ...BRANDS.flatMap((b) => {
      const categories: Array<"cameras" | "lenses"> = ["cameras", "lenses"];
      const brandMounts = MOUNTS.filter(
        (m) => m.brand_id === b.id && !!m.short_name,
      );
      const brandCategoryUrls = categories.map((c) => ({
        url: `https://sharplyphoto.com/browse/${b.slug}/${c}`,
        lastModified: new Date(),
        changeFrequency: "hourly" as const,
        priority: 0.6,
      }));
      const mountUrls = categories.flatMap((c) =>
        brandMounts.map((m) => ({
          url: `https://sharplyphoto.com/browse/${b.slug}/${c}/${String(m.short_name)}`,
          lastModified: new Date(),
          changeFrequency: "hourly" as const,
          priority: 0.6,
        })),
      );
      return [...brandCategoryUrls, ...mountUrls];
    }),
  ];
}
