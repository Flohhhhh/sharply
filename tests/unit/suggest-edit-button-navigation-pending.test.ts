import { createElement, type ComponentProps, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const linkStatusMocks = vi.hoisted(() => ({
  pending: false,
  useLinkStatus: vi.fn(() => ({ pending: linkStatusMocks.pending })),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    scroll: _scroll,
    ...props
  }: ComponentProps<"a"> & { children?: ReactNode; scroll?: boolean }) =>
    createElement("a", props, children),
  useLinkStatus: linkStatusMocks.useLinkStatus,
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("~/lib/auth/auth-client", () => ({
  useSession: () => ({ data: { session: { id: "session-id" } } }),
}));

import { SuggestEditButton } from "~/app/[locale]/(pages)/gear/_components/suggest-edit-button";

function renderButton(pending: boolean) {
  linkStatusMocks.pending = pending;

  return renderToStaticMarkup(
    createElement(SuggestEditButton, {
      slug: "canon-eos-r5",
      gearType: "CAMERA",
    }),
  );
}

describe("Suggest Edit navigation pending state", () => {
  it("uses the shared link button for edit-modal navigation", () => {
    const markup = renderButton(false);

    expect(markup).toContain('data-link-button-root="true"');
    expect(markup).toContain('href="/gear/canon-eos-r5/edit?type=CAMERA"');
    expect(markup).toContain('data-link-button-pending="false"');
    expect(markup).not.toContain("animate-spin");
  });

  it("shows the shared loading spinner while the edit route is pending", () => {
    const markup = renderButton(true);

    expect(markup).toContain('data-link-button-pending="true"');
    expect(markup).toContain("animate-spin");
  });
});
