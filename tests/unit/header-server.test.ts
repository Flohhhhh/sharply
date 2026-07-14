import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { HeaderViewModel } from "~/components/layout/header-model";

const intlServerMocks = vi.hoisted(() => ({
  getTranslations: vi.fn(),
}));

const headerClientMock = vi.hoisted(() => vi.fn((_props: unknown) => null));

vi.mock("next-intl/server", () => intlServerMocks);
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

function getHeaderClientProps() {
  const firstCall = headerClientMock.mock.calls.at(0);
  if (!firstCall) {
    throw new Error("Expected HeaderClient to render");
  }

  return firstCall[0] as { locale: string; model: HeaderViewModel };
}

describe("header server component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    intlServerMocks.getTranslations.mockImplementation(
      async ({ namespace }: { locale: string; namespace: "common" | "nav" }) =>
        (key: string) =>
          `${namespace}.${key}`,
    );
  });

  it("builds a signed-out model with localized hrefs for the given locale", async () => {
    renderToStaticMarkup(await Header({ locale: "ja" }));
    const model = getHeaderModel();
    const props = getHeaderClientProps();

    expect(props.locale).toBe("ja");
    expect(model.homeHref).toBe("/ja");
    expect(model.adminHref).toBe("/ja/admin");
    expect(model.accountHref).toBe("/ja/profile/settings");
    expect(model.developerHref).toBe("/ja/developer");
    expect(model.labels.signIn).toBe("common.signIn");
    expect(model.moreLabel).toBe("nav.more");
  });

  it("keeps the server model static and locale-scoped", async () => {
    renderToStaticMarkup(await Header({ locale: "en" }));
    const model = getHeaderModel();

    expect(model).toEqual({
      homeHref: "/",
      adminHref: "/admin",
      accountHref: "/profile/settings",
      developerHref: "/developer",
      labels: {
        adminPanel: "common.adminPanel",
        developerPortal: "common.developerPortal",
        signIn: "common.signIn",
        profile: "common.profile",
        account: "common.account",
        logOut: "common.logOut",
        anonymous: "common.anonymous",
      },
      navItems: expect.any(Array),
      footerItems: expect.any(Object),
      moreLabel: "nav.more",
    });
  });
});
