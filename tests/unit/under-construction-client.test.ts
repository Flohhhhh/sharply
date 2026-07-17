import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import UnderConstructionClient from "~/app/[locale]/(pages)/lists/under-construction/_components/under-construction-client";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("~/components/ui/checkbox", () => ({
  Checkbox: () => createElement("input", { type: "checkbox" }),
}));

vi.mock("~/components/ui/progress", () => ({
  Progress: ({ value }: { value: number }) =>
    createElement("div", { "data-progress": value }),
}));

vi.mock("~/components/ui/collapsible", () => ({
  Collapsible: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
  CollapsibleTrigger: ({ children }: { children: ReactNode }) =>
    createElement("button", { "aria-expanded": "false" }, children),
  CollapsibleContent: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
}));

vi.mock("~/components/ui/select", () => ({
  Select: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
  SelectContent: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
  SelectItem: ({ children, value }: { children: ReactNode; value: string }) =>
    createElement("div", { "data-value": value }, children),
  SelectSeparator: () => createElement("div", null, "|divider|"),
  SelectTrigger: ({
    children,
    "aria-label": ariaLabel,
  }: {
    children: ReactNode;
    "aria-label"?: string;
  }) => createElement("div", { "aria-label": ariaLabel }, children),
  SelectValue: ({ placeholder }: { placeholder?: string }) =>
    createElement("div", null, placeholder),
}));

vi.mock(
  "~/app/[locale]/(pages)/lists/under-construction/_components/under-construction-table",
  () => ({
    default: () => createElement("div"),
  }),
);

function renderBrandSelect(
  brands: Array<{
    value: string;
    label: string;
    sortOrder: number | null;
    totalCount?: number;
    underConstructionCount?: number;
  }>,
  summary = {
    totalCount: 0,
    underConstructionCount: 0,
    completedCount: 0,
    completedPercent: 0,
  },
) {
  return renderToStaticMarkup(
    createElement(UnderConstructionClient, {
      items: [],
      summary,
      brands: brands.map((brand) => ({
        ...brand,
        totalCount: brand.totalCount ?? 0,
        underConstructionCount: brand.underConstructionCount ?? 0,
      })),
      types: [],
    }),
  );
}

describe("UnderConstructionClient brand filter", () => {
  it("uses the same priority ordering as the admin brand selector", () => {
    const html = renderBrandSelect([
      { value: "sigma", label: "Sigma", sortOrder: null },
      { value: "nikon", label: "Nikon", sortOrder: 2 },
      { value: "canon", label: "Canon", sortOrder: 1 },
    ]);

    expect(html.indexOf("allBrands")).toBeLessThan(html.lastIndexOf("Canon"));
    expect(html.lastIndexOf("Canon")).toBeLessThan(html.lastIndexOf("Nikon"));
    expect(html.lastIndexOf("Nikon")).toBeLessThan(html.indexOf("|divider|"));
    expect(html.indexOf("|divider|")).toBeLessThan(html.lastIndexOf("Sigma"));
  });

  it("keeps unprioritized brands alphabetical without a divider", () => {
    const html = renderBrandSelect([
      { value: "zeiss", label: "Zeiss", sortOrder: null },
      { value: "canon", label: "Canon", sortOrder: null },
    ]);

    expect(html.lastIndexOf("Canon")).toBeLessThan(html.lastIndexOf("Zeiss"));
    expect(html).not.toContain("|divider|");
  });

  it("shows compact overall and per-brand completion counts", () => {
    const html = renderBrandSelect(
      [
        {
          value: "canon",
          label: "Canon",
          sortOrder: 1,
          totalCount: 10,
          underConstructionCount: 3,
        },
      ],
      {
        totalCount: 18,
        underConstructionCount: 6,
        completedCount: 12,
        completedPercent: 67,
      },
    );

    expect(html).toContain("67%");
    expect(html).toContain("12/18");
    expect(html).toContain("Canon");
    expect(html).toContain("70%");
    expect(html).toContain("7/10");
    expect(html).not.toContain("catalogSummary");
  });

  it("shows zero completion for brands without catalog items", () => {
    const html = renderBrandSelect([
      {
        value: "empty-brand",
        label: "Empty Brand",
        sortOrder: null,
      },
    ]);

    expect(html).toContain("Empty Brand");
    expect(html).toContain("0%");
    expect(html).toContain("0/0");
  });

  it("hides filter labels visually while retaining accessible names", () => {
    const html = renderBrandSelect([]);

    expect(html).toContain('aria-label="brand"');
    expect(html).toContain('aria-label="type"');
    expect(html).not.toContain(">brand<");
    expect(html).not.toContain(">type<");
  });
});
