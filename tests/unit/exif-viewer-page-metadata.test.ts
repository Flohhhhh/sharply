import { describe,expect,it,vi } from "vitest";
import { buildDefaultOgImageUrl } from "~/lib/seo/default-og-image";

vi.mock("~/app/[locale]/(pages)/(tools)/exif-viewer/_components/exif-preview-trigger", () => ({
  default: () => null,
}));

vi.mock("~/app/[locale]/(pages)/(tools)/exif-viewer/client", () => ({
  default: () => null,
}));

import { metadata } from "~/app/[locale]/(pages)/(tools)/exif-viewer/page";

describe("exif viewer page metadata", () => {
  it("falls back to the root app OG image", () => {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.sharplyphoto.com";

    expect(metadata.openGraph?.images).toEqual([
      {
        url: buildDefaultOgImageUrl(baseUrl),
        width: 1200,
        height: 630,
        alt: "Sharply shutter count and EXIF viewer",
      },
    ]);
    expect(metadata.twitter?.images).toEqual([buildDefaultOgImageUrl(baseUrl)]);
  });
});
