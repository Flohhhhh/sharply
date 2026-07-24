import { createElement, type ComponentProps, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) =>
    ({
      dialogTitle: "Search Sharply",
      inputPlaceholder: "Search Sharply",
      advancedSearch: "Advanced Search",
      enterKey: "Enter",
    })[key] ?? key,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("~/lib/hooks/useCountry", () => ({
  useCountry: () => ({ countryCode: null }),
}));

vi.mock("@hooks/useSearchSuggestions", () => ({
  useSearchSuggestions: () => ({
    results: [],
    networkLoading: false,
    typingPending: false,
    hasShownResultsForCurrentInput: false,
  }),
}));

vi.mock("motion/react", () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => children,
  LazyMotion: ({ children }: { children: ReactNode }) => children,
  domAnimation: {},
  m: {
    div: ({
      children,
      layout: _layout,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      transition: _transition,
      ...props
    }: ComponentProps<"div"> & Record<string, unknown>) =>
      createElement("div", props, children),
  },
  useReducedMotion: () => true,
}));

import { SearchModalScene } from "~/components/search/search-modal-scene";
import { getEmptySearchSubmitHref } from "~/components/search/search-modal-utils";

describe("SearchModalScene", () => {
  it("renders the advanced-search Enter hint when opened blank", () => {
    const markup = renderToStaticMarkup(
      createElement(SearchModalScene, { open: false, onOpenChange: vi.fn() }),
    );

    expect(markup).toContain("Enter");
    expect(markup).toContain("Advanced Search");
    expect(markup).toContain(
      "hidden items-center gap-2 text-sm sm:inline-flex",
    );
  });

  it("uses the empty search route only for blank queries", () => {
    expect(getEmptySearchSubmitHref("")).toBe("/search");
    expect(getEmptySearchSubmitHref("   ")).toBe("/search");
    expect(getEmptySearchSubmitHref("nikon")).toBeUndefined();
  });
});
