import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach,describe,expect,it,vi } from "vitest";
import type { HeaderViewModel } from "~/components/layout/header-model";

const headerMocks = vi.hoisted(() => ({
  headers: vi.fn(),
}));

const intlServerMocks = vi.hoisted(() => ({
  getLocale: vi.fn(),
  getTranslations: vi.fn(),
}));

const authMocks = vi.hoisted(() => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

const notificationMocks = vi.hoisted(() => ({
  fetchNotificationsForUser: vi.fn(),
}));

const headerClientMock = vi.hoisted(() => vi.fn((_props: unknown) => null));

vi.mock("next/headers", () => headerMocks);
vi.mock("next-intl/server", () => intlServerMocks);
vi.mock("~/auth", () => authMocks);
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
    headerMocks.headers.mockResolvedValue(
      new Headers([
        ["x-sharply-normalized-pathname", "/about"],
        ["x-sharply-normalized-search", "?q=sony"],
      ]),
    );
    intlServerMocks.getLocale.mockResolvedValue("ja");
    intlServerMocks.getTranslations.mockImplementation(
      async ({
        namespace,
      }: {
        locale: string;
        namespace: "common" | "nav";
      }) =>
        (key: string) => `${namespace}.${key}`,
    );
    authMocks.auth.api.getSession.mockResolvedValue(null);
    notificationMocks.fetchNotificationsForUser.mockResolvedValue(null);
  });

  it("builds a signed-out model with a localized sign-in callback URL", async () => {
    renderToStaticMarkup(await Header());
    const model = getHeaderModel();

    expect(model.user).toBeNull();
    expect(model.callbackUrl).toBe("/ja/about?q=sony");
    expect(model.signInHref).toBe(
      "/ja/auth/signin?callbackUrl=%2Fja%2Fabout%3Fq%3Dsony",
    );
    expect(model.labels.signIn).toBe("common.signIn");
    expect(notificationMocks.fetchNotificationsForUser).not.toHaveBeenCalled();
  });

  it("fetches notifications on the server and passes them into the client model", async () => {
    authMocks.auth.api.getSession.mockResolvedValue({
      user: {
        id: "user-1",
        role: "EDITOR",
        handle: "camfan",
        memberNumber: 7,
        name: "Cam Fan",
        email: "cam@example.com",
        image: null,
      },
    });
    notificationMocks.fetchNotificationsForUser.mockResolvedValue({
      userId: "user-1",
      notifications: [],
      archived: [],
      unreadCount: 2,
    });

    renderToStaticMarkup(await Header());
    const model = getHeaderModel();

    expect(notificationMocks.fetchNotificationsForUser).toHaveBeenCalledWith({
      userId: "user-1",
      limit: 10,
      archivedLimit: 5,
    });
    expect(model.user?.id).toBe("user-1");
    expect(model.profileHref).toBe("/ja/u/camfan");
    expect(model.notifications).toEqual({
      userId: "user-1",
      notifications: [],
      archived: [],
      unreadCount: 2,
    });
  });
});
