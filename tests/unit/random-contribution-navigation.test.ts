import { createElement, type ComponentProps, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetchRandomUrl: vi.fn(),
  getTranslations: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
}));
vi.mock("next/link", () => ({
  default: ({
    children,
    prefetch: _prefetch,
    ...props
  }: ComponentProps<"a"> & { children?: ReactNode; prefetch?: boolean }) => {
    void _prefetch;
    return createElement("a", props, children);
  },
  useLinkStatus: () => ({ pending: false }),
}));
vi.mock("next-intl/server", () => ({
  getTranslations: mocks.getTranslations,
}));
vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));
vi.mock("~/server/gear/service", () => ({
  fetchRandomLowCompletionGearUrl: mocks.fetchRandomUrl,
}));

import RandomContributionPage from "~/app/[locale]/(pages)/contribute/random/page";
import { RandomContributionBanner } from "~/components/home/random-contribution-banner";

describe("RandomContributionBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getTranslations.mockResolvedValue(
      (key: string) =>
        ({
          contributionQuestTitle: "Surprise Me",
          contributionQuestDescription:
            "Go to a random gear item that needs contributions.",
          contributionQuestAction: "Random Item",
        })[key],
    );
  });

  it("renders the contribution prompt and internal random link", async () => {
    const html = renderToStaticMarkup(
      await RandomContributionBanner({ locale: "ja" }),
    );

    expect(html).toContain("Surprise Me");
    expect(html).toContain(
      "Go to a random gear item that needs contributions.",
    );
    expect(html).toContain("Random Item");
    expect(html).toContain('href="/ja/contribute/random"');
    expect(html).toContain('data-link-button-root="true"');
  });
});

describe("RandomContributionPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.redirect.mockImplementation((destination: string) => {
      throw new Error(`redirect:${destination}`);
    });
  });

  it("redirects to a freshly selected localized gear page", async () => {
    mocks.fetchRandomUrl.mockResolvedValue("/gear/nikon-z6iii");

    await expect(
      RandomContributionPage({ params: Promise.resolve({ locale: "ja" }) }),
    ).rejects.toThrow("redirect:/ja/gear/nikon-z6iii");
    expect(mocks.fetchRandomUrl).toHaveBeenCalledTimes(1);
  });

  it("falls back to the contribution list when no gear is available", async () => {
    mocks.fetchRandomUrl.mockResolvedValue(null);

    await expect(
      RandomContributionPage({ params: Promise.resolve({ locale: "en" }) }),
    ).rejects.toThrow("redirect:/lists/under-construction");
  });
});
