import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement, type ReactNode } from "react";

vi.mock("next/link", () => ({
  default: (props: { children?: unknown; href: string } & Record<string, unknown>) => {
    const { children, href, ...rest } = props;
    return createElement("a", { href, ...rest }, children as ReactNode);
  },
}));

vi.mock("~/lib/utils", () => ({
  formatRelativeTime: vi.fn(() => "1h ago"),
}));

import { ActivityList } from "~/components/home/activity-list";
import { mapGearRowsToHomeActivityItems } from "~/server/gear/home-activity";

describe("mapGearRowsToHomeActivityItems", () => {
  it("limits results to 5 items ordered by the latest event first", () => {
    const base = new Date("2026-03-20T10:00:00.000Z");
    const rows = Array.from({ length: 6 }, (_, index) => {
      const createdAt = new Date(base.getTime() + index * 60_000);
      const updatedAt = new Date(createdAt.getTime() + index * 1_000);

      return {
        id: `gear-${index}`,
        slug: `gear-${index}`,
        name: `Gear ${index}`,
        createdAt,
        updatedAt,
      };
    });

    const items = mapGearRowsToHomeActivityItems(rows);

    expect(items).toHaveLength(5);
    expect(items.map((item) => item.id)).toEqual([
      "gear-5",
      "gear-4",
      "gear-3",
      "gear-2",
      "gear-1",
    ]);
  });

  it("marks rows with unchanged updatedAt as created", () => {
    const timestamp = new Date("2026-03-20T10:00:00.000Z");

    const [item] = mapGearRowsToHomeActivityItems([
      {
        id: "gear-1",
        slug: "gear-1",
        name: "Gear 1",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ]);

    expect(item).toMatchObject({
      id: "gear-1",
      eventType: "created",
      eventAt: timestamp,
    });
  });

  it("marks rows with later updatedAt as updated", () => {
    const createdAt = new Date("2026-03-20T10:00:00.000Z");
    const updatedAt = new Date("2026-03-21T10:00:00.000Z");

    const [item] = mapGearRowsToHomeActivityItems([
      {
        id: "gear-1",
        slug: "gear-1",
        name: "Gear 1",
        createdAt,
        updatedAt,
      },
    ]);

    expect(item).toMatchObject({
      id: "gear-1",
      eventType: "updated",
      eventAt: updatedAt,
    });
  });

  it("normalizes string timestamps from database results before sorting", () => {
    const items = mapGearRowsToHomeActivityItems([
      {
        id: "gear-older",
        slug: "gear-older",
        name: "Gear Older",
        createdAt: "2026-03-20T10:00:00.000Z",
        updatedAt: "2026-03-20T10:00:00.000Z",
        eventAt: "2026-03-20T10:00:00.000Z",
      },
      {
        id: "gear-newer",
        slug: "gear-newer",
        name: "Gear Newer",
        createdAt: "2026-03-21T10:00:00.000Z",
        updatedAt: "2026-03-22T10:00:00.000Z",
        eventAt: "2026-03-22T10:00:00.000Z",
      },
    ]);

    expect(items.map((item) => item.id)).toEqual(["gear-newer", "gear-older"]);
    expect(items[0]?.eventAt).toBeInstanceOf(Date);
    expect(items[0]?.eventType).toBe("updated");
  });
});

describe("ActivityList", () => {
  it("renders nothing when there are no items", () => {
    expect(
      renderToStaticMarkup(createElement(ActivityList, { items: [] })),
    ).toBe("");
  });

  it("renders the activity heading and gear links", () => {
    const html = renderToStaticMarkup(
      createElement(ActivityList, {
        items: [
          {
            id: "gear-1",
            slug: "sony-a7-iv",
            name: "Sony A7 IV",
            eventType: "updated",
            eventAt: new Date("2026-03-21T10:00:00.000Z"),
          },
          {
            id: "gear-2",
            slug: "nikon-z9-ii",
            name: "Nikon Z9 II",
            eventType: "created",
            eventAt: new Date("2026-03-22T10:00:00.000Z"),
          },
        ],
      }),
    );

    expect(html).toContain("Activity");
    expect(html).toContain('href="/gear/sony-a7-iv"');
    expect(html).toContain('href="/gear/nikon-z9-ii"');
    expect(html).toContain("Sony A7 IV");
    expect(html).toContain("updated");
    expect(html).toContain("Nikon Z9 II");
    expect(html).toContain("created");
  });
});
