import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { BrandSelect } from "~/components/custom-inputs/brand-select";

vi.mock("~/components/ui/select", () => ({
  Select: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
  SelectContent: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
  SelectItem: ({
    children,
    value,
  }: {
    children: ReactNode;
    value: string;
  }) => createElement("div", { "data-value": value }, children),
  SelectSeparator: () => createElement("div", null, "|divider|"),
  SelectTrigger: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
  SelectValue: ({ placeholder }: { placeholder?: string }) =>
    createElement("div", null, placeholder),
}));

describe("BrandSelect", () => {
  it("renders ordered brands before null-order brands with a divider", () => {
    const html = renderToStaticMarkup(
      createElement(BrandSelect, {
        value: "",
        onChange: () => {},
        allowClear: false,
        brands: [
          { id: "sigma", name: "Sigma", slug: "sigma", sortOrder: null },
          { id: "nikon", name: "Nikon", slug: "nikon", sortOrder: 2 },
          { id: "canon", name: "Canon", slug: "canon", sortOrder: 1 },
        ],
      }),
    );

    expect(html.indexOf("Canon")).toBeLessThan(html.indexOf("Nikon"));
    expect(html.indexOf("Nikon")).toBeLessThan(html.indexOf("|divider|"));
    expect(html.indexOf("|divider|")).toBeLessThan(html.indexOf("Sigma"));
  });

  it("omits the divider when every brand has a null sort order", () => {
    const html = renderToStaticMarkup(
      createElement(BrandSelect, {
        value: "",
        onChange: () => {},
        allowClear: false,
        brands: [
          { id: "canon", name: "Canon", slug: "canon", sortOrder: null },
          { id: "nikon", name: "Nikon", slug: "nikon", sortOrder: null },
        ],
      }),
    );

    expect(html).not.toContain("|divider|");
  });
});
