import { beforeEach,describe,expect,it,vi } from "vitest";

vi.hoisted(() => {
  process.env.DATABASE_URL ??= "postgres://user:pass@localhost:5432/sharply";
  process.env.PAYLOAD_SECRET ??= "test-secret";
  process.env.NEXT_PUBLIC_BASE_URL ??= "https://www.sharplyphoto.com";
});

const intlServerMocks = vi.hoisted(() => ({
  getTranslations: vi.fn(),
  setRequestLocale: vi.fn(),
}));

const browseServiceMocks = vi.hoisted(() => ({
  resolveScopeOrThrow: vi.fn(),
  fetchBrowseListPage: vi.fn(),
  fetchBrandBySlug: vi.fn(),
  fetchReleaseFeedPage: vi.fn(),
  fetchMountsForBrand: vi.fn(),
  buildSeo: vi.fn(),
}));

const popularityServiceMocks = vi.hoisted(() => ({
  fetchTrendingSlugs: vi.fn(),
  fetchTrending: vi.fn(),
}));

vi.mock("next-intl/server", () => intlServerMocks);
vi.mock("server-only", () => ({}));
vi.mock("~/server/gear/browse/service", () => browseServiceMocks);
vi.mock("~/server/popularity/service", () => popularityServiceMocks);
vi.mock("~/components/gear/gear-card", () => ({
  GearCard: () => null,
  GearCardSkeleton: () => null,
}));
vi.mock("~/app/[locale]/(pages)/browse/_components/other-brands-select", () => ({
  OtherBrandsSelect: () => null,
}));
vi.mock("~/app/[locale]/(pages)/browse/_components/release-feed-grid", () => ({
  ReleaseFeedGrid: () => null,
}));
vi.mock(
  "~/app/[locale]/(pages)/browse/_components/browse-query-controls",
  () => ({
    BrowseQueryControls: () => null,
  }),
);
vi.mock("~/app/[locale]/(pages)/browse/_components/browse-results-grid", () => ({
  BrowseResultsGrid: () => null,
}));

import BrowsePage from "~/app/[locale]/(pages)/browse/[[...segments]]/page";
import AllGearContent from "~/app/[locale]/(pages)/browse/_components/all-gear-content";
import Breadcrumbs from "~/app/[locale]/(pages)/browse/_components/breadcrumbs";
import MountButtons from "~/app/[locale]/(pages)/browse/_components/mount-buttons";

describe("browse server locale handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    intlServerMocks.getTranslations.mockResolvedValue((key: string) => key);
    browseServiceMocks.resolveScopeOrThrow.mockResolvedValue({
      depth: 0,
      scope: {},
      brand: null,
      mount: null,
    });
    browseServiceMocks.fetchBrowseListPage.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      perPage: 24,
      hasMore: false,
    });
    browseServiceMocks.fetchBrandBySlug.mockResolvedValue(null);
    browseServiceMocks.fetchReleaseFeedPage.mockResolvedValue({
      items: [],
      nextCursor: null,
      hasMore: false,
    });
    browseServiceMocks.fetchMountsForBrand.mockResolvedValue([]);
    popularityServiceMocks.fetchTrendingSlugs.mockResolvedValue([]);
    popularityServiceMocks.fetchTrending.mockResolvedValue([]);
  });

  it("sets the request locale and uses explicit translations on the browse page", async () => {
    await BrowsePage({
      params: Promise.resolve({ locale: "ja", segments: [] }),
    });

    expect(intlServerMocks.setRequestLocale).toHaveBeenCalledWith("ja");
    expect(intlServerMocks.getTranslations).toHaveBeenCalledWith({
      locale: "ja",
      namespace: "browsePage",
    });
  });

  it("uses explicit locale-scoped translations in browse server components", async () => {
    await AllGearContent({ locale: "de" });
    await Breadcrumbs({
      locale: "fr",
      brand: { name: "Canon", slug: "canon" },
      category: "lenses",
      mountValue: "RF",
    });
    await MountButtons({
      locale: "it",
      brandId: "brand-1",
      brandSlug: "canon",
      category: "lenses",
    });

    expect(intlServerMocks.getTranslations).toHaveBeenCalledWith({
      locale: "de",
      namespace: "browsePage",
    });
    expect(intlServerMocks.getTranslations).toHaveBeenCalledWith({
      locale: "fr",
      namespace: "browsePage",
    });
    expect(intlServerMocks.getTranslations).toHaveBeenCalledWith({
      locale: "it",
      namespace: "browsePage",
    });
  });
});
