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

import { LinkButton } from "~/components/ui/link-button";

function renderLinkButton({
  pending,
  iconPosition,
}: {
  pending: boolean;
  iconPosition?: "left" | "right";
}) {
  linkStatusMocks.pending = pending;

  return renderToStaticMarkup(
    createElement(
      LinkButton,
      {
        href: "/browse",
        icon: createElement("span", { "data-test-icon": "true" }),
        iconPosition,
      },
      "Browse gear",
    ),
  );
}

describe("link button navigation pending state", () => {
  it("renders without pending loading by default", () => {
    const markup = renderLinkButton({ pending: false });

    expect(markup).toContain('data-link-button-pending="false"');
    expect(markup).not.toContain("animate-spin");
  });

  it("shows the shared button loading spinner while pending", () => {
    const markup = renderLinkButton({ pending: true });

    expect(markup).toContain('data-link-button-pending="true"');
    expect(markup).toContain("animate-spin");
  });

  it("preserves right-aligned loading placement for link-style buttons", () => {
    const markup = renderLinkButton({ pending: true, iconPosition: "right" });

    expect(markup).toContain('data-link-button-pending="true"');
    expect(markup).toContain("animate-spin");
  });
});
