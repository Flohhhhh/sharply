import { describe,expect,it } from "vitest";
import {
  buildHeaderInitialSearch,
  buildHeaderInitialState,
  buildHeaderRouteState,
  buildHeaderViewModel,
  type HeaderLabels,
  type HeaderNotificationsData,
  type HeaderUser,
} from "~/components/layout/header-model";
import { getFooterItems,getNavItems } from "~/lib/nav-items";

const t = (key: string) => key;

const labels: HeaderLabels = {
  adminPanel: "Admin Panel",
  signIn: "Sign In",
  profile: "Profile",
  account: "Account",
  logOut: "Log Out",
  anonymous: "Anonymous",
};

describe("header model", () => {
  it("reads initial route state from middleware headers", () => {
    const requestHeaders = new Headers({
      "x-sharply-normalized-pathname": "/search",
      "x-sharply-normalized-search": "?q=sony",
    });

    expect(buildHeaderInitialState(requestHeaders)).toEqual({
      normalizedPathname: "/search",
      routeState: {
        initialMode: "expanded",
        scrollResponsive: false,
      },
    });
    expect(buildHeaderInitialSearch(requestHeaders)).toBe("?q=sony");
  });

  it("chooses the expected initial mode for home, search, and normal pages", () => {
    expect(buildHeaderRouteState("/")).toEqual({
      initialMode: "expanded",
      scrollResponsive: true,
    });
    expect(buildHeaderRouteState("/search")).toEqual({
      initialMode: "expanded",
      scrollResponsive: false,
    });
    expect(buildHeaderRouteState("/about")).toEqual({
      initialMode: "compact",
      scrollResponsive: false,
    });
  });

  it("localizes links and preserves callback URLs for non-default locales", () => {
    const model = buildHeaderViewModel({
      locale: "ja",
      normalizedPathname: "/about",
      normalizedSearch: "?q=sony",
      navItems: getNavItems(t),
      footerItems: getFooterItems(t),
      labels,
      moreLabel: "More",
      user: null,
      notifications: null,
    });

    expect(model.callbackUrl).toBe("/ja/about?q=sony");
    expect(model.signInHref).toBe(
      "/ja/auth/signin?callbackUrl=%2Fja%2Fabout%3Fq%3Dsony",
    );
    expect(model.navItems[0]?.href).toBe("/ja/about");
    expect(model.footerItems.bottomLinks).toEqual(
      expect.arrayContaining([expect.objectContaining({ href: "/ja/contact" })]),
    );
  });

  it("keeps default-locale links unprefixed and carries signed-in data through", () => {
    const user: HeaderUser = {
      id: "user-1",
      role: "EDITOR",
      handle: "camfan",
      memberNumber: 7,
      name: "Cam Fan",
      email: "cam@example.com",
      image: null,
    };
    const notifications: HeaderNotificationsData = {
      notifications: [
        {
          id: "n1",
          type: "badge_awarded",
          title: "Badge",
          body: "Won a badge",
          linkUrl: "/u/camfan",
          sourceType: null,
          sourceId: null,
          metadata: null,
          readAt: null,
          archivedAt: null,
          createdAt: "2026-04-22T12:00:00.000Z",
        },
      ],
      archived: [],
      unreadCount: 1,
    };

    const model = buildHeaderViewModel({
      locale: "en",
      normalizedPathname: "/gear",
      normalizedSearch: "",
      navItems: getNavItems(t),
      footerItems: getFooterItems(t),
      labels,
      moreLabel: "More",
      user,
      notifications,
    });

    expect(model.homeHref).toBe("/");
    expect(model.profileHref).toBe("/u/camfan");
    expect(model.isAdminOrEditor).toBe(true);
    expect(model.notifications).toEqual(notifications);
  });
});
