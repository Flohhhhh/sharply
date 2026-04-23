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

const notificationMocks = vi.hoisted(() => ({
  fetchNotificationsForUser: vi.fn(),
}));

const headerClientMock = vi.hoisted(() => vi.fn((_props: unknown) => null));

vi.mock("~/auth", () => authMocks);
vi.mock("next-intl/server", () => intlServerMocks);
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
    expect(model.labels.signIn).toBe("common.signIn");
    // callbackUrl and signInHref are now computed client-side from the live pathname
    expect(notificationMocks.fetchNotificationsForUser).not.toHaveBeenCalled();
  });

  it("does not fetch auth or notifications server-side (moved to client)", async () => {
    renderToStaticMarkup(await Header({ locale: "ja" }));
    const model = getHeaderModel();

    // Auth state is resolved client-side via useSession(); the server always
    // passes user: null so ISR prerendering never touches headers() or cookies().
    expect(model.user).toBeNull();
    expect(model.notifications).toBeNull();
    expect(notificationMocks.fetchNotificationsForUser).not.toHaveBeenCalled();
  });
});
