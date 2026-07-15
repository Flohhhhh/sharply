import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { FiltersModal } from "~/components/search/filters-modal";

vi.mock("@utils/url", () => ({
  mergeSearchParams: () => "",
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/search",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("~/i18n/client", () => ({
  useLocalePathnames: () => ({ pathname: "/search" }),
}));

vi.mock("~/components/ui/button", () => ({
  Button: ({ children }: { children: ReactNode }) =>
    createElement("button", null, children),
}));

vi.mock("~/components/ui/dialog", () => ({
  Dialog: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
  DialogContent: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
  DialogHeader: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
  DialogTitle: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
  DialogTrigger: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
}));

vi.mock("~/components/ui/radio-group", () => ({
  RadioGroup: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
  RadioGroupItem: () => createElement("input", { type: "radio" }),
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
  SelectValue: () => createElement("div"),
}));

vi.mock("~/components/ui/slider", () => ({
  Slider: () => createElement("div"),
}));

describe("FiltersModal brand filter", () => {
  it("uses the priority ordering shared by other brand selectors", () => {
    const html = renderToStaticMarkup(createElement(FiltersModal));

    expect(html.indexOf('data-value="Canon"')).toBeLessThan(
      html.indexOf('data-value="Nikon"'),
    );
    expect(html.indexOf('data-value="Nikon"')).toBeLessThan(
      html.indexOf("|divider|"),
    );
    expect(html.indexOf("|divider|")).toBeLessThan(
      html.indexOf('data-value="Pentax"'),
    );
  });
});
