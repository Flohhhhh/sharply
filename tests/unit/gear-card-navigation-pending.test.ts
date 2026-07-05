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

vi.mock("next/image", () => ({
  default: ({
    alt,
    src,
    ...props
  }: ComponentProps<"img"> & { src: string }) =>
    createElement("img", { ...props, alt, src }),
}));

vi.mock("next-intl", () => ({
  useLocale: vi.fn(() => "en-US"),
}));

vi.mock("~/lib/hooks/useGearDisplayName", () => ({
  useGearDisplayName: ({ name }: { name: string }) => name,
}));

vi.mock("~/lib/utils/is-in-hall-of-fame", () => ({
  isInHallOfFame: () => false,
}));

vi.mock("~/lib/utils/is-new", () => ({
  isNewRelease: () => false,
}));

vi.mock("~/components/gear/gear-card-more-menu", () => ({
  GearCardMoreMenu: () => createElement("div", { "data-gear-card-more-menu": true }),
}));

import { GearCard } from "~/components/gear/gear-card";
import { GearCardHorizontal } from "~/components/gear/gear-card-horizontal";

function renderGearCard(component: "vertical" | "horizontal", pending: boolean) {
  linkStatusMocks.pending = pending;

  const props = {
    href: "/gear/canon-eos-r5",
    slug: "canon-eos-r5",
    name: "Canon EOS R5",
    brandName: "Canon",
    releaseDate: "2024-02-01",
    priceText: "$3899",
  };

  return renderToStaticMarkup(
    createElement(
      component === "vertical" ? GearCard : GearCardHorizontal,
      props,
    ),
  );
}

describe("gear card navigation pending state", () => {
  it.each(["vertical", "horizontal"] as const)(
    "renders the %s shared card without pending UI by default",
    (variant) => {
      const markup = renderGearCard(variant, false);

      expect(markup).toContain('data-gear-card-pending="false"');
      expect(markup).toContain('data-gear-card-content-pending="false"');
      expect(markup).not.toContain('data-gear-card-pending-overlay="true"');
    },
  );

  it.each(["vertical", "horizontal"] as const)(
    "renders the %s shared card with faded content and overlay while pending",
    (variant) => {
      const markup = renderGearCard(variant, true);

      expect(markup).toContain('data-gear-card-pending="true"');
      expect(markup).toContain('data-gear-card-content-pending="true"');
      expect(markup).toContain('data-gear-card-pending-overlay="true"');
    },
  );
});
