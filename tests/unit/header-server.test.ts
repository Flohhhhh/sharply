import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach,describe,expect,it,vi } from "vitest";
import type { HeaderViewModel } from "~/components/layout/header-model";

// Keep mocks for modules that are still transitively imported (e.g. header-model
// imports types from ~/auth and ~/server/notifications/service).
const authMocks = vi.hoisted(() => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

const intlServerMocks = vi.hoisted(() => ({
  getTranslations: vi.fn(),
}));

const nextHeadersMocks = vi.hoisted(() => ({
  headers: vi.fn(),
}));

const notificationMocks = vi.hoisted(() => ({
  fetchNotificationsForUser: vi.fn(),
}));

const headerClientMock = vi.hoisted(() => vi.fn((_props: unknown) => null));

vi.mock("~/auth", () => authMocks);
vi.mock("next-intl/server", () => intlServerMocks);
vi.mock("next/headers", () => nextHeadersMocks);
vi.mock("~/server/notifications/service", () => notificationMocks);
vi.mock("~/components/layout/header-client", () => ({
  default: headerClientMock,
}));

import Header from "~/components/layout/header";

function getHeaderModel() {
  const firstCall = headerClientMock.mock.calls.at(0);
  if (!firstCall) {
    throw new Error("Expected HeaderClient to render");
  }

  return (firstCall[0] as { model: HeaderViewModel }).model;
}

describe("header server component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nextHeadersMocks.headers.mockResolvedValue(
      new Headers({
        "x-sharply-normalized-pathname": "/",
        "x-sharply-normalized-search": "",
      }),
    );
    intlServerMocks.getTranslations.mockImplementation(
      async ({
        namespace,
      }: {
        locale: string;
        namespace: "common" | "nav";
      }) =>
        (key: string) => `${namespace}.${key}`,
    );
  });

  it("builds a signed-out model with localized hrefs for the given locale", async () => {
    renderToStaticMarkup(await Header({ locale: "ja" }));
    const model = getHeaderModel();

    expect(model.user).toBeNull();
    expect(model.notifications).toBeNull();
    expect(model.homeHref).toBe("/ja");
    expect(model.adminHref).toBe("/ja/admin");
    expect(model.initialMode).toBe("expanded");
    expect(model.labels.signIn).toBe("common.signIn");
    expect(model.callbackUrl).toBe("/ja");
    expect(model.signInHref).toBe("/ja/auth/signin?callbackUrl=%2Fja");
    expect(notificationMocks.fetchNotificationsForUser).not.toHaveBeenCalled();
  });

  it("uses normalized routing headers to seed inner pages without auth fetches", async () => {
    nextHeadersMocks.headers.mockResolvedValue(
      new Headers({
        "x-sharply-normalized-pathname": "/gear/sony-a6700",
        "x-sharply-normalized-search": "?tab=reviews",
      }),
    );

    renderToStaticMarkup(await Header({ locale: "ja" }));
    const model = getHeaderModel();

    expect(model.user).toBeNull();
    expect(model.notifications).toBeNull();
    expect(model.initialMode).toBe("compact");
    expect(model.callbackUrl).toBe("/ja/gear/sony-a6700?tab=reviews");
    expect(model.signInHref).toBe(
      "/ja/auth/signin?callbackUrl=%2Fja%2Fgear%2Fsony-a6700%3Ftab%3Dreviews",
    );
    expect(notificationMocks.fetchNotificationsForUser).not.toHaveBeenCalled();
  });
});
