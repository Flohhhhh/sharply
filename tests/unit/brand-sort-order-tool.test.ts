import { createElement, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const actionMocks = vi.hoisted(() => ({
  actionUpdateBrandSortOrders: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));
vi.mock("~/server/admin/brands/actions", () => actionMocks);
vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: { children: ReactNode }) => createElement("div", null, children),
  KeyboardSensor: function KeyboardSensor() {},
  PointerSensor: function PointerSensor() {},
  closestCenter: vi.fn(),
  useSensor: vi.fn(() => ({})),
  useSensors: vi.fn(() => []),
}));
vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: { children: ReactNode }) => createElement("div", null, children),
  arrayMove: vi.fn((items: unknown[], oldIndex: number, newIndex: number) => {
    const nextItems = [...items];
    const [movedItem] = nextItems.splice(oldIndex, 1);
    nextItems.splice(newIndex, 0, movedItem);
    return nextItems;
  }),
  sortableKeyboardCoordinates: vi.fn(),
  useSortable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  })),
  verticalListSortingStrategy: vi.fn(),
}));
vi.mock("@dnd-kit/utilities", () => ({
  CSS: {
    Transform: {
      toString: vi.fn(() => undefined),
    },
  },
}));
vi.mock("~/components/ui/button", () => ({
  Button: ({
    children,
    ...props
  }: ButtonHTMLAttributes<HTMLButtonElement>) =>
    createElement("button", props, children),
}));
vi.mock("~/components/ui/card", () => ({
  Card: ({ children }: { children: ReactNode }) => createElement("div", null, children),
  CardHeader: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
  CardContent: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
  CardTitle: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
}));
vi.mock("~/components/ui/input", () => ({
  Input: (props: InputHTMLAttributes<HTMLInputElement>) =>
    createElement("input", props),
}));
vi.mock("~/components/ui/table", () => ({
  Table: ({ children }: { children: ReactNode }) => createElement("table", null, children),
  TableHeader: ({ children }: { children: ReactNode }) =>
    createElement("thead", null, children),
  TableBody: ({ children }: { children: ReactNode }) =>
    createElement("tbody", null, children),
  TableRow: ({ children }: { children: ReactNode }) => createElement("tr", null, children),
  TableHead: ({ children }: { children: ReactNode }) => createElement("th", null, children),
  TableCell: ({ children }: { children: ReactNode }) => createElement("td", null, children),
}));

import { BrandSortOrderTool } from "~/app/[locale]/(admin)/admin/brand-sort-order-tool";

describe("BrandSortOrderTool", () => {
  it("renders ranked and unranked controls with rebuild guidance", () => {
    const html = renderToStaticMarkup(
      createElement(BrandSortOrderTool, {
        initialBrands: [
          { id: "canon", name: "Canon", slug: "canon", sortOrder: 1 },
          { id: "sigma", name: "Sigma", slug: "sigma", sortOrder: null },
        ],
      }),
    );

    expect(html).toContain("Canon");
    expect(html).toContain("Drag");
    expect(html).toMatch(/Canon[\s\S]*?Unrank<\/button>/);
    expect(html).toMatch(/Sigma[\s\S]*?(?<!Un)Rank<\/button>/);
    expect(html).toContain(
      "appear across generated brand lists after the next rebuild",
    );
  });
});
