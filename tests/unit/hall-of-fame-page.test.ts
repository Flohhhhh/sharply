import { createElement,Fragment } from "react";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach,describe,expect,it,vi } from "vitest";

const gearServiceMocks = vi.hoisted(() => ({
  fetchGearSummariesBySlugs: vi.fn(),
}));

const intlServerMocks = vi.hoisted(() => ({
  getTranslations: vi.fn(),
}));

vi.mock("~/server/gear/service", () => gearServiceMocks);
vi.mock("next-intl/server", () => intlServerMocks);
vi.mock("next/image", () => ({
  default: ({ priority: _priority, ...props }: Record<string, unknown>) =>
    createElement("img", props),
}));
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children?: ReactNode;
    href: string;
  } & Record<string, unknown>) =>
    createElement("a", { href, ...props }, children),
}));
vi.mock("@/components/ui/blur-fade", () => ({
  BlurFade: ({ children }: { children?: ReactNode }) =>
    createElement(Fragment, null, children),
}));
vi.mock("@/components/ui/separator", () => ({
  Separator: () => createElement("hr"),
}));

import Page from "~/app/[locale]/(pages)/lists/hall-of-fame/page";

function createHallOfFameTranslator() {
  const t = ((key: string) => {
    const messages: Record<string, string> = {
      pageTitle: "Hall of Fame",
      intro: "Intro copy",
      emptyTitle: "No entries",
      emptyDescription: "Nothing to show",
      noImageAvailable: "No image available",
    };
    return messages[key] ?? key;
  }) as ((key: string) => string) & { has: (key: string) => boolean };

  t.has = () => false;
  return t;
}

describe("hall of fame page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    intlServerMocks.getTranslations.mockResolvedValue(createHallOfFameTranslator());
  });

  it("renders with lightweight gear summaries, skips missing items, and keeps newest-first ordering", async () => {
    gearServiceMocks.fetchGearSummariesBySlugs.mockResolvedValue([
      {
        id: "gear-1",
        slug: "sony-a9-iii",
        name: "Sony a9 III",
        brandName: "Sony",
        thumbnailUrl: "https://cdn.example.com/a9iii.jpg",
        releaseDate: new Date("2024-03-08T00:00:00.000Z"),
        releaseDatePrecision: "DAY",
        announcedDate: null,
        announceDatePrecision: null,
        publicationState: "PUBLISHED",
      },
      {
        id: "gear-2",
        slug: "nikon-d500",
        name: "D500",
        brandName: "Nikon",
        thumbnailUrl: "https://cdn.example.com/d500.jpg",
        releaseDate: new Date("2016-03-01T00:00:00.000Z"),
        releaseDatePrecision: "MONTH",
        announcedDate: null,
        announceDatePrecision: null,
        publicationState: "PUBLISHED",
      },
    ]);

    const html = renderToStaticMarkup(
      await Page({ params: Promise.resolve({ locale: "en" }) }),
    );

    expect(gearServiceMocks.fetchGearSummariesBySlugs).toHaveBeenCalledTimes(1);
    expect(html).toContain("Sony a9 III");
    expect(html).not.toContain("Sony Sony a9 III");
    expect(html).toContain("Nikon D500");
    expect(html).not.toContain("Tamron 35-150mm");
    expect(html.indexOf("Sony a9 III")).toBeLessThan(html.indexOf("Nikon D500"));
  });
});
