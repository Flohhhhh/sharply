import { createElement, type ComponentProps, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const navigationMocks = vi.hoisted(() => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    refresh: vi.fn(),
  })),
}));

vi.mock("next/navigation", () => navigationMocks);
vi.mock("next-intl", () => ({
  useTranslations: () =>
    (key: string, values?: Record<string, string>) => {
      const messages: Record<string, string> = {
        title: "Rename Gear Item",
        navigateAfterRename: "Go to item page after renaming",
      };
      if (key === "aliasPlaceholder") return `Name for ${values?.region}`;
      return messages[key] ?? key;
    },
}));
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  },
}));
vi.mock("~/server/admin/gear/actions", () => ({
  actionRenameGear: vi.fn(),
  actionUpdateGearAliases: vi.fn(),
}));
vi.mock("~/components/ui/button", () => ({
  Button: ({
    children,
    loading: _loading,
    ...props
  }: ComponentProps<"button"> & { loading?: boolean }) =>
    createElement("button", props, children),
}));
vi.mock("~/components/ui/checkbox", () => ({
  Checkbox: ({
    onCheckedChange,
    ...props
  }: ComponentProps<"input"> & {
    onCheckedChange?: (checked: boolean) => void;
  }) =>
    createElement("input", {
      ...props,
      type: "checkbox",
      onChange: () => onCheckedChange?.(!props.checked),
    }),
}));
vi.mock("~/components/ui/input", () => ({
  Input: (props: ComponentProps<"input">) => createElement("input", props),
}));
vi.mock("~/components/ui/label", () => ({
  Label: ({ children, ...props }: ComponentProps<"label">) =>
    createElement("label", props, children),
}));
vi.mock("~/components/ui/dialog", () => ({
  Dialog: ({ children }: { children: ReactNode }) =>
    createElement("div", { "data-testid": "dialog" }, children),
  DialogTrigger: ({ children }: { children: ReactNode }) =>
    createElement("div", { "data-testid": "dialog-trigger" }, children),
  DialogContent: ({ children, ...props }: ComponentProps<"div">) =>
    createElement("div", props, children),
  DialogDescription: ({
    children,
    ...props
  }: ComponentProps<"p">) => createElement("p", props, children),
  DialogFooter: ({ children, ...props }: ComponentProps<"div">) =>
    createElement("div", props, children),
  DialogHeader: ({ children, ...props }: ComponentProps<"div">) =>
    createElement("div", props, children),
  DialogTitle: ({ children, ...props }: ComponentProps<"h2">) =>
    createElement("h2", props, children),
}));

import { RenameGearDialog } from "~/components/gear/rename-gear-dialog";
import {
  buildInitialAliasMap,
  buildRegionalAliasUpdates,
  getRenameGearDialogOpenState,
} from "~/components/gear/rename-gear-dialog-utils";

describe("RenameGearDialog", () => {
  it("renders without aliases and includes the navigate option", () => {
    const markup = renderToStaticMarkup(
      createElement(RenameGearDialog, {
        gearId: "gear-1",
        currentName: "Canon EOS R5",
        currentSlug: "canon-eos-r5",
        showNavigateOption: true,
      }),
    );

    expect(markup).toContain("Rename Gear Item");
    expect(markup).toContain("navigate-after-rename");
    expect(markup).toContain("Go to item page after renaming");
  });

  it("builds an empty alias map when aliases are omitted", () => {
    expect(buildInitialAliasMap(undefined)).toEqual({});

    expect(
      getRenameGearDialogOpenState({
        currentName: "Canon EOS R5",
        defaultNavigateAfterRename: true,
        regionalAliases: undefined,
      }),
    ).toEqual({
      newName: "Canon EOS R5",
      navigateAfterRename: true,
      aliases: {},
    });
  });

  it("prepopulates the US, EU, and JP aliases in the dialog open state", () => {
    const regionalAliases = [
      {
        gearId: "gear-1",
        region: "US" as const,
        name: "Rokinon AF 35mm F1.8",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
      {
        gearId: "gear-1",
        region: "EU" as const,
        name: "Canon EOS R5 EU",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
      {
        gearId: "gear-1",
        region: "JP" as const,
        name: "Canon EOS R5 JP",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ];

    expect(buildInitialAliasMap(regionalAliases)).toEqual({
      US: "Rokinon AF 35mm F1.8",
      EU: "Canon EOS R5 EU",
      JP: "Canon EOS R5 JP",
    });

    expect(
      getRenameGearDialogOpenState({
        currentName: "Canon EOS R5",
        defaultNavigateAfterRename: false,
        regionalAliases,
      }),
    ).toEqual({
      newName: "Canon EOS R5",
      navigateAfterRename: false,
      aliases: {
        US: "Rokinon AF 35mm F1.8",
        EU: "Canon EOS R5 EU",
        JP: "Canon EOS R5 JP",
      },
    });
  });

  it("builds verbatim regional alias updates and nulls blank values", () => {
    expect(
      buildRegionalAliasUpdates({
        US: "  Rokinon AF 35mm F1.8  ",
        EU: "Samyang AF 35mm F1.8",
        JP: "   ",
      }),
    ).toEqual([
      { region: "US", name: "Rokinon AF 35mm F1.8" },
      { region: "EU", name: "Samyang AF 35mm F1.8" },
      { region: "JP", name: null },
    ]);
  });
});
