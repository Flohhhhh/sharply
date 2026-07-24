import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import { GlobalSearchBar } from "~/components/search/global-search-bar";

const messages = {
  search: {
    inputPlaceholder: "Search Sharply",
    searchAction: "Search",
    staticPlaceholder: "Search for anything",
    openSearch: "Open search",
    rotatingExampleAnything: "for anything",
    rotatingExampleCameraBasic: "Nikon Z8",
    rotatingExampleLensBasic: "35mm f/1.8 lenses",
    rotatingExampleSonyBasic: "Sony A7 IV",
    rotatingExampleFujifilmBasic: "Fujifilm X100VI",
    rotatingExampleBrandLenses: "Canon lenses",
    rotatingExampleMountLenses: "Nikon Z lenses",
    rotatingExampleLensesForCamera: "lenses for D5300",
    rotatingExampleBrandMountCameras: "Canon RF cameras",
  },
};

function renderGlobalSearchBar(
  props: Partial<React.ComponentProps<typeof GlobalSearchBar>> = {},
) {
  return renderToStaticMarkup(
    createElement(NextIntlClientProvider, {
      locale: "en",
      messages,
      timeZone: "America/New_York",
      children: createElement(GlobalSearchBar, props),
    }),
  );
}

describe("GlobalSearchBar", () => {
  it("renders a static search label by default", () => {
    const html = renderGlobalSearchBar();

    expect(html).toContain(">Search for anything</span>");
    expect(html).not.toContain(">Search</span>");
  });

  it("renders a rotating query example when enabled", () => {
    const html = renderGlobalSearchBar({ showRotatingExamples: true });

    expect(html).toContain(">Search</span>");
    expect(html).toContain(">for anything</");
  });

  it("hides the default hotkey hint on mobile screens", () => {
    const html = renderGlobalSearchBar();

    expect(html).toContain('class="shrink-0 hidden sm:inline-flex"');
  });

  it("hides the large hotkey hint on mobile screens", () => {
    const html = renderGlobalSearchBar({ size: "lg" });

    expect(html).toContain('class="shrink-0 hidden sm:inline-flex"');
  });

  it("keeps the small hotkey hint hidden on mobile screens", () => {
    const html = renderGlobalSearchBar({ size: "sm" });

    expect(html).toContain('class="shrink-0 hidden sm:inline-flex"');
  });
});
