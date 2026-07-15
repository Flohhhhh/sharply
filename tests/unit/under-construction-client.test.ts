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
  Progress: () => createElement("div"),
}));

vi.mock("~/components/ui/select", () => ({
  Select: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
  SelectContent: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
  SelectItem: ({ children, value }: { children: ReactNode; value: string }) =>
    createElement("div", { "data-value": value }, children),
  SelectSeparator: () => createElement("div", null, "|divider|"),
  SelectTrigger: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
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
  brands: Array<{ value: string; label: string; sortOrder: number | null }>,
) {
  return renderToStaticMarkup(
    createElement(UnderConstructionClient, {
      items: [],
      summary: {
        totalCount: 0,
        underConstructionCount: 0,
        completedCount: 0,
        completedPercent: 0,
      },
      brands,
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

    expect(html.indexOf("allBrands")).toBeLessThan(html.indexOf("Canon"));
    expect(html.indexOf("Canon")).toBeLessThan(html.indexOf("Nikon"));
    expect(html.indexOf("Nikon")).toBeLessThan(html.indexOf("|divider|"));
    expect(html.indexOf("|divider|")).toBeLessThan(html.indexOf("Sigma"));
  });

  it("keeps unprioritized brands alphabetical without a divider", () => {
    const html = renderBrandSelect([
      { value: "zeiss", label: "Zeiss", sortOrder: null },
      { value: "canon", label: "Canon", sortOrder: null },
    ]);

    expect(html.indexOf("Canon")).toBeLessThan(html.indexOf("Zeiss"));
    expect(html).not.toContain("|divider|");
  });
});
