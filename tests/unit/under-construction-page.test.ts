import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BRANDS } from "~/lib/generated";

const gearServiceMocks = vi.hoisted(() => ({
  listUnderConstruction: vi.fn(),
}));

const metricsMocks = vi.hoisted(() => ({
  fetchGearCount: vi.fn(),
  fetchPublishedGearCountsByBrand: vi.fn(),
}));

const authMocks = vi.hoisted(() => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

const headerMocks = vi.hoisted(() => ({
  headers: vi.fn(),
}));

const authHelperMocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
}));

const intlServerMocks = vi.hoisted(() => ({
  getTranslations: vi.fn(async ({ namespace }: { namespace?: string } = {}) => {
    if (namespace === "underConstructionPage") {
      return (key: string) => key;
    }
    return (key: string) => key;
  }),
}));

const clientComponentMock = vi.hoisted(() => vi.fn((_props: unknown) => null));
const pageParams = {
  params: Promise.resolve({ locale: "en" }),
};

vi.mock("~/server/gear/service", () => gearServiceMocks);
vi.mock("~/server/metrics/service", () => metricsMocks);
vi.mock("~/auth", () => authMocks);
vi.mock("next/headers", () => headerMocks);
vi.mock("~/lib/auth/auth-helpers", () => authHelperMocks);
vi.mock("next-intl/server", () => intlServerMocks);
vi.mock(
  "~/app/[locale]/(pages)/lists/under-construction/_components/under-construction-client",
  () => ({
    default: clientComponentMock,
  }),
);

import Page from "~/app/[locale]/(pages)/lists/under-construction/page";

type ClientProps = {
  canToggleAutoSubmit: boolean;
  items: unknown[];
  brands: Array<{
    value: string;
    label: string;
    sortOrder: number | null;
    totalCount: number;
    underConstructionCount: number;
  }>;
  summary: {
    totalCount: number;
    underConstructionCount: number;
    completedCount: number;
    completedPercent: number;
  };
};

function getClientProps() {
  const firstCall = clientComponentMock.mock.calls.at(0);
  if (!firstCall) {
    throw new Error("Expected UnderConstructionClient to render");
  }
  return firstCall[0] as unknown as ClientProps;
}

describe("under construction page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headerMocks.headers.mockResolvedValue(new Headers());
    authMocks.auth.api.getSession.mockResolvedValue({ user: { id: "user-1" } });
    authHelperMocks.requireRole.mockReturnValue(true);
    metricsMocks.fetchPublishedGearCountsByBrand.mockResolvedValue([]);
  });

  it("passes the computed catalog summary to the client", async () => {
    const items = [
      {
        id: "1",
        slug: "alpha",
        name: "Alpha",
        brandId: BRANDS[0]!.id,
        createdAt: new Date(),
      },
      {
        id: "2",
        slug: "beta",
        name: "Beta",
        brandId: BRANDS[0]!.id,
        createdAt: new Date(),
      },
    ];
    gearServiceMocks.listUnderConstruction.mockResolvedValue(items);
    metricsMocks.fetchGearCount.mockResolvedValue(10);
    metricsMocks.fetchPublishedGearCountsByBrand.mockResolvedValue([
      { brandId: BRANDS[0]!.id, count: 6 },
      { brandId: BRANDS[1]!.id, count: 4 },
    ]);

    renderToStaticMarkup(await Page(pageParams));
    const props = getClientProps();

    expect(gearServiceMocks.listUnderConstruction).toHaveBeenCalledWith(1, 40);
    expect(metricsMocks.fetchGearCount).toHaveBeenCalledTimes(1);
    expect(metricsMocks.fetchPublishedGearCountsByBrand).toHaveBeenCalledTimes(
      1,
    );
    expect(props.canToggleAutoSubmit).toBe(true);
    expect(props.items).toBe(items);
    expect(props.brands).toEqual(
      BRANDS.map((brand) => ({
        value: brand.id,
        label: brand.name,
        sortOrder: brand.sort_order,
        totalCount:
          brand.id === BRANDS[0]!.id ? 6 : brand.id === BRANDS[1]!.id ? 4 : 0,
        underConstructionCount: brand.id === BRANDS[0]!.id ? 2 : 0,
      })),
    );
    expect(props.summary).toEqual({
      totalCount: 10,
      underConstructionCount: 2,
      completedCount: 8,
      completedPercent: 80,
    });
  });

  it("handles an empty catalog without dividing by zero", async () => {
    gearServiceMocks.listUnderConstruction.mockResolvedValue([]);
    metricsMocks.fetchGearCount.mockResolvedValue(0);

    renderToStaticMarkup(await Page(pageParams));
    const props = getClientProps();

    expect(props.summary).toEqual({
      totalCount: 0,
      underConstructionCount: 0,
      completedCount: 0,
      completedPercent: 0,
    });
    expect(props.brands.every((brand) => brand.totalCount === 0)).toBe(true);
    expect(
      props.brands.every((brand) => brand.underConstructionCount === 0),
    ).toBe(true);
  });

  it("clamps completed items at zero when the backlog matches the total", async () => {
    gearServiceMocks.listUnderConstruction.mockResolvedValue([
      { id: "1", slug: "alpha", name: "Alpha", createdAt: new Date() },
      { id: "2", slug: "beta", name: "Beta", createdAt: new Date() },
      { id: "3", slug: "gamma", name: "Gamma", createdAt: new Date() },
    ]);
    metricsMocks.fetchGearCount.mockResolvedValue(3);

    renderToStaticMarkup(await Page(pageParams));
    const props = getClientProps();

    expect(props.summary).toEqual({
      totalCount: 3,
      underConstructionCount: 3,
      completedCount: 0,
      completedPercent: 0,
    });
  });
});
