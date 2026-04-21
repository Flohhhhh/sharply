import type { MetadataRoute } from "next";
import { locales } from "~/i18n/config";

function getLocalizedDisallowPaths(path: string) {
  return [path, ...locales.map((locale) => `/${locale}${path}`)];
}

export default function robots(): MetadataRoute.Robots {
  return {
    // rules: {
    //   userAgent: "*",
    //   disallow: "/",
    // },
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        ...getLocalizedDisallowPaths("/admin/"),
        ...getLocalizedDisallowPaths("/api/"),
        ...getLocalizedDisallowPaths("/auth/"),
        ...getLocalizedDisallowPaths("/brand/"),
        ...getLocalizedDisallowPaths("/invite/"),
        ...getLocalizedDisallowPaths("/construction-test/"),
        ...getLocalizedDisallowPaths("/ui-demo/"),
        ...getLocalizedDisallowPaths("/cms/"),
        ...getLocalizedDisallowPaths("/recommended-lenses/"),
        ...getLocalizedDisallowPaths("/focal-simulator/"),
        ...getLocalizedDisallowPaths("/list/"),
      ],
    },
    sitemap: "https://www.sharplyphoto.com/sitemap.xml",
  };
}
