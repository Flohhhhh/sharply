import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import { GlobalSearchBar } from "~/components/search/global-search-bar";

const messages = {
  search: {
    inputPlaceholder: "Search Sharply",
    searchAction: "Search",
    openSearch: "Open search",
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
