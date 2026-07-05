import { createElement, type ComponentProps, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const linkStatusMocks = vi.hoisted(() => ({
  pending: false,
  useLinkStatus: vi.fn(() => ({
    pending: linkStatusMocks.pending,
  })),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    ...props
  }: ComponentProps<"a"> & { children?: ReactNode }) =>
    createElement("a", props, children),
  useLinkStatus: linkStatusMocks.useLinkStatus,
}));

vi.mock("~/components/gear/gear-display-name", () => ({
  GearDisplayName: ({ name }: { name: string }) => name,
}));

import {
  TrendingListClient,
  type TrendingListRowItem,
} from "~/components/trending-list.client";
import type { TrendingEntry } from "~/types/popularity";

function createTrendingItem(
  overrides: Partial<TrendingEntry> = {},
): TrendingListRowItem {
  return {
    gearId: "gear-1",
    slug: "fujifilm-x100vi",
    name: "Fujifilm X100VI",
    regionalAliases: null,
    brandName: "Fujifilm",
    gearType: "CAMERA",
    thumbnailUrl: null,
    releaseDate: null,
    releaseDatePrecision: null,
    announcedDate: null,
    announceDatePrecision: null,
    msrpNowUsdCents: null,
    mpbMaxPriceUsdCents: null,
    lifetimeViews: 0,
    score: 87,
    asOfDate: "2026-07-04T00:00:00.000Z",
    stats: {
      views: 0,
      wishlistAdds: 0,
      ownerAdds: 0,
      compareAdds: 0,
      reviewSubmits: 0,
    },
    filled: 3,
    ...overrides,
  };
}

function renderTrendingRow(pending: boolean) {
  linkStatusMocks.pending = pending;

  return renderToStaticMarkup(
    createElement(TrendingListClient, {
      items: [createTrendingItem()],
    }),
  );
}

describe("trending row navigation pending state", () => {
  it("renders the row without pending UI by default", () => {
    const markup = renderTrendingRow(false);

    expect(markup).toContain('data-trending-row-pending="false"');
    expect(markup).toContain('data-trending-row-content-pending="false"');
    expect(markup).not.toContain('data-trending-row-pending-overlay="true"');
  });

  it("renders the row with faded text and a right-side spinner while pending", () => {
    const markup = renderTrendingRow(true);

    expect(markup).toContain('data-trending-row-pending="true"');
    expect(markup).toContain('data-trending-row-content-pending="true"');
    expect(markup).toContain('data-trending-row-pending-overlay="true"');
  });
});
