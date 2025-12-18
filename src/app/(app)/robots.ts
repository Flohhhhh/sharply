import type { MetadataRoute } from "next";

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
        "/admin/",
        "/api/",
        "/auth/",
        "/brand/",
        "/invite/",
        "/construction-test/",
        "/ui-demo/",
        "/cms/",
        "/learn/", // TODO: finish feature and add to sitemap
        "/recommended-lenses/", // TODO: finish feature and add to sitemap
        "/focal-simulator/", // TODO: finish feature and add to sitemap
      ],
    },
    sitemap: "https://sharplyphoto.com/sitemap.xml",
  };
}
