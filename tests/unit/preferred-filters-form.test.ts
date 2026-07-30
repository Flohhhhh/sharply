import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("~/server/users/actions", () => ({
  actionUpdatePreferredFilters: vi.fn(),
}));

vi.mock("~/components/ui/button", () => ({
  Button: ({
    children,
    disabled,
  }: {
    children: ReactNode;
    disabled?: boolean;
  }) => createElement("button", { disabled }, children),
}));

vi.mock("~/components/ui/label", () => ({
  Label: ({
    children,
    htmlFor,
  }: {
    children: ReactNode;
    htmlFor?: string;
  }) => createElement("label", { htmlFor }, children),
}));

vi.mock("~/components/custom-inputs/brand-select", () => ({
  BrandSelect: ({
    value,
    placeholder,
  }: {
    value: string;
    placeholder?: string;
  }) =>
    createElement("brand-select", {
      "data-placeholder": placeholder,
      "data-value": value,
    }),
}));

vi.mock("~/components/custom-inputs/mount-select", () => ({
  MountSelect: ({
    disabled,
    filterBrand,
    placeholder,
    value,
  }: {
    disabled?: boolean;
    filterBrand?: string | null;
    placeholder?: string;
    value: string | string[] | null;
  }) =>
    createElement("mount-select", {
      "data-disabled": disabled ? "true" : "false",
      "data-filter-brand": filterBrand ?? "",
      "data-placeholder": placeholder,
      "data-value": Array.isArray(value) ? value.join(",") : (value ?? ""),
    }),
}));

import {
  getNextPreferredMountId,
  PreferredFiltersForm,
} from "~/app/[locale]/(pages)/profile/settings/preferred-filters-form";

describe("PreferredFiltersForm", () => {
  it("renders the mount select as disabled until a brand is chosen", () => {
    const html = renderToStaticMarkup(
      createElement(PreferredFiltersForm, {
        defaultBrandId: null,
        defaultMountId: null,
      }),
    );

    expect(html).toContain('mount-select data-disabled="true"');
  });

  it("keeps the current mount when the new brand still matches it", () => {
    expect(
      getNextPreferredMountId({
        currentMountId: "21323f59-f91a-418a-8f88-09aeacd0f84d",
        nextBrandId: "7df18188-0939-4241-9ca7-6561c6e233e1",
      }),
    ).toBe("21323f59-f91a-418a-8f88-09aeacd0f84d");
  });

  it("clears an incompatible mount when the brand changes", () => {
    expect(
      getNextPreferredMountId({
        currentMountId: "21323f59-f91a-418a-8f88-09aeacd0f84d",
        nextBrandId: "a19fbe71-3a17-4095-8d79-f40eb5475480",
      }),
    ).toBeNull();
  });
});
