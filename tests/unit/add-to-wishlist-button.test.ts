import { createElement, type MouseEvent, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  buttonOnClick: undefined as
    | ((event: MouseEvent<HTMLButtonElement>) => void)
    | undefined,
  session: {
    data: {
      session: { userId: "42a61cc8-97ee-464c-a622-daf17fcfd312" },
      user: {
        id: "42a61cc8-97ee-464c-a622-daf17fcfd312",
        handle: "camera-kit" as string | null,
        memberNumber: 42,
      },
    },
  },
  toggleWishlist: vi.fn(),
  toastPromise: vi.fn(),
}));

vi.mock("lucide-react", () => ({
  Heart: () => createElement("svg"),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    useState: <T,>(initial: T) => [initial, vi.fn()] as const,
  };
});

vi.mock("sonner", () => ({
  toast: {
    promise: mocks.toastPromise,
  },
}));

vi.mock("~/components/badges/badge-toast", () => ({
  withBadgeToasts: <T,>(promise: Promise<T>) => promise,
}));

vi.mock("~/components/ui/button", () => ({
  Button: ({ children, onClick }: { children: ReactNode; onClick?: typeof mocks.buttonOnClick }) => {
    mocks.buttonOnClick = onClick;
    return createElement("button", { onClick }, children);
  },
}));

vi.mock("~/lib/auth/auth-client", () => ({
  useSession: () => mocks.session,
}));

vi.mock("~/server/gear/actions", () => ({
  actionToggleWishlist: mocks.toggleWishlist,
}));

import { AddToWishlistButton } from "~/components/gear/add-to-wishlist-button";

type ToastSuccess = (result: { ok: true; action: "added" }) => {
  action?: {
    label: string;
    onClick: () => void;
  };
};

function renderAndGetSuccessToast() {
  renderToStaticMarkup(createElement(AddToWishlistButton, { slug: "test-gear" }));

  expect(mocks.buttonOnClick).toBeDefined();
  mocks.buttonOnClick?.({
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as unknown as MouseEvent<HTMLButtonElement>);

  const [, options] = mocks.toastPromise.mock.calls[0] as [
    Promise<unknown>,
    { success: ToastSuccess },
  ];
  return options.success;
}

describe("AddToWishlistButton", () => {
  beforeEach(() => {
    mocks.buttonOnClick = undefined;
    mocks.session.data.user = {
      id: "42a61cc8-97ee-464c-a622-daf17fcfd312",
      handle: "camera-kit",
      memberNumber: 42,
    };
    mocks.toggleWishlist.mockResolvedValue({ ok: true, action: "added" });
    mocks.toastPromise.mockClear();
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        dispatchEvent: vi.fn(),
        location: {},
      },
    });
  });

  it("opens the public profile using a custom handle", () => {
    const success = renderAndGetSuccessToast();
    const toast = success({ ok: true, action: "added" });

    toast.action?.onClick();

    expect(globalThis.window.location.href).toBe("/u/camera-kit");
  });

  it("falls back to the member-number profile when the user has no handle", () => {
    mocks.session.data.user.handle = null;
    const success = renderAndGetSuccessToast();
    const toast = success({ ok: true, action: "added" });

    toast.action?.onClick();

    expect(globalThis.window.location.href).toBe("/u/user-42");
  });
});
