import { describe, expect, it } from "vitest";
import { buildLocalizedMetadata } from "~/lib/seo/metadata";

const BASE = "https://www.sharplyphoto.com";

describe("buildLocalizedMetadata", () => {
  it("emits a self-referential canonical for the default locale", () => {
    const metadata = buildLocalizedMetadata("/about", {});
    expect(metadata.alternates?.canonical).toBe(`${BASE}/about`);
  });

  it("emits a self-referential canonical for non-default locales", () => {
    const metadata = buildLocalizedMetadata("/about", {}, "ja");
    expect(metadata.alternates?.canonical).toBe(`${BASE}/ja/about`);
  });

  it("keeps hreflang alternates for every locale with x-default on en", () => {
    const metadata = buildLocalizedMetadata("/about", {}, "de");
    const languages = metadata.alternates?.languages as Record<string, string>;
    expect(languages.en).toBe(`${BASE}/about`);
    expect(languages.de).toBe(`${BASE}/de/about`);
    expect(languages.ja).toBe(`${BASE}/ja/about`);
    expect(languages["x-default"]).toBe(`${BASE}/about`);
  });

  it("falls back to the default locale for unknown locale strings", () => {
    const metadata = buildLocalizedMetadata("/about", {}, "xx");
    expect(metadata.alternates?.canonical).toBe(`${BASE}/about`);
  });

  it("localizes the open graph url and locale when openGraph is provided", () => {
    const metadata = buildLocalizedMetadata(
      "/about",
      { openGraph: { title: "About" } },
      "fr",
    );
    expect(metadata.openGraph?.url).toBe(`${BASE}/fr/about`);
    expect(
      (metadata.openGraph as Record<string, unknown> | undefined)?.locale,
    ).toBe("fr_FR");
  });

  it("preserves an explicitly provided open graph url", () => {
    const metadata = buildLocalizedMetadata(
      "/about",
      { openGraph: { url: "https://example.com/custom" } },
      "fr",
    );
    expect(metadata.openGraph?.url).toBe("https://example.com/custom");
  });

  it("does not fabricate openGraph when none was provided", () => {
    const metadata = buildLocalizedMetadata("/about", {}, "fr");
    expect(metadata.openGraph).toBeUndefined();
  });
});
