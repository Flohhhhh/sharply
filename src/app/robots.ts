import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/api/",
        "/auth/",
        "/construction-test/",
        "/ui-demo/",
      ],
    },
    sitemap: "https://sharplyphoto.com/sitemap.xml",
  };
}
