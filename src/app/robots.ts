import type { MetadataRoute } from "next";
import { locales } from "~/i18n/config";

export const dynamic = "force-static";

const disallowedPaths = [
  "/admin/",
  "/api/",
  "/auth/",
  "/brand/",
  "/invite/",
  "/construction-test/",
  "/ui-demo/",
  "/cms/",
  "/recommended-lenses/",
  "/focal-simulator/",
  "/list/",
] as const;

function getLocalizedDisallowPaths(path: (typeof disallowedPaths)[number]) {
  return [path, ...locales.map((locale) => `/${locale}${path}`)];
}

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: disallowedPaths.flatMap((path) => getLocalizedDisallowPaths(path)),
    },
    sitemap: "https://www.sharplyphoto.com/sitemap.xml",
  };
}
