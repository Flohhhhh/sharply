import { describe, expect, it } from "vitest";
import {
  buildHeaderCallbackUrl,
  buildHeaderRouteState,
  buildHeaderViewModel,
  type HeaderLabels,
} from "~/components/layout/header-model";
import { getFooterItems, getNavItems } from "~/lib/nav-items";

const t = (key: string) => key;

const labels: HeaderLabels = {
  adminPanel: "Admin Panel",
  developerPortal: "Developer Portal",
  signIn: "Sign In",
  profile: "Profile",
  account: "Account",
  logOut: "Log Out",
  anonymous: "Anonymous",
};

describe("header model", () => {
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

  it("builds localized callback URLs for non-default locales", () => {
    expect(buildHeaderCallbackUrl("ja", "/about", "?q=sony")).toBe(
      "/ja/about?q=sony",
    );
  });

  it("localizes server-safe header links for non-default locales", () => {
    const model = buildHeaderViewModel({
      locale: "ja",
      navItems: getNavItems(t),
      footerItems: getFooterItems(t),
      labels,
      moreLabel: "More",
    });

    expect(model.homeHref).toBe("/ja");
    expect(model.adminHref).toBe("/ja/admin");
    expect(model.accountHref).toBe("/ja/profile/settings");
    expect(model.developerHref).toBe("/ja/developer");
    expect(model.navItems[0]?.href).toBe("/ja/about");
    expect(model.footerItems.bottomLinks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ href: "/ja/contact" }),
      ]),
    );
  });

  it("keeps default-locale links unprefixed", () => {
    const model = buildHeaderViewModel({
      locale: "en",
      navItems: getNavItems(t),
      footerItems: getFooterItems(t),
      labels,
      moreLabel: "More",
    });

    expect(model.homeHref).toBe("/");
    expect(model.adminHref).toBe("/admin");
    expect(model.accountHref).toBe("/profile/settings");
    expect(model.developerHref).toBe("/developer");
  });
});
