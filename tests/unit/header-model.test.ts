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

  it("places Search directly after News as a standalone header link", () => {
    const model = buildHeaderViewModel({
      locale: "en",
      navItems: getNavItems(t),
      footerItems: getFooterItems(t),
      labels,
      moreLabel: "More",
    });
    const newsIndex = model.navItems.findIndex((item) => item.href === "/news");
    const searchIndex = model.navItems.findIndex(
      (item) => item.href === "/search",
    );

    expect(newsIndex).toBeGreaterThanOrEqual(0);
    expect(searchIndex).toBeGreaterThanOrEqual(0);
    expect(searchIndex).toBe(newsIndex + 1);
    expect(model.navItems[searchIndex]?.items).toBeUndefined();
  });

  it("adds localized Collections navigation under Gear", () => {
    const defaultLocaleModel = buildHeaderViewModel({
      locale: "en",
      navItems: getNavItems(t),
      footerItems: getFooterItems(t),
      labels,
      moreLabel: "More",
    });
    const gearItem = defaultLocaleModel.navItems.find(
      (item) => item.title === "gear",
    );
    const collectionsItem = gearItem?.items?.find(
      (item) => item.href === "/tags",
    );

    expect(gearItem?.pendingFeedback).toBe(true);
    expect(collectionsItem).toEqual({
      title: "gearCollectionsTitle",
      href: "/tags",
      description: "gearCollectionsDescription",
      iconKey: "circlePile",
    });

    const browseItem = gearItem?.items?.find((item) => item.href === "/gear");
    expect(browseItem?.featured).toBe(true);
    expect(gearItem?.items?.filter((item) => item.featured)).toHaveLength(1);

    const japaneseModel = buildHeaderViewModel({
      locale: "ja",
      navItems: getNavItems(t),
      footerItems: getFooterItems(t),
      labels,
      moreLabel: "More",
    });
    const localizedGearItem = japaneseModel.navItems.find(
      (item) => item.title === "gear",
    );

    expect(localizedGearItem?.pendingFeedback).toBe(true);
    expect(localizedGearItem?.items).toEqual(
      expect.arrayContaining([expect.objectContaining({ href: "/ja/tags" })]),
    );
    expect(
      localizedGearItem?.items?.find((item) => item.href === "/ja/gear")
        ?.featured,
    ).toBe(true);
  });

  it("keeps categories without featured items in the standard shape", () => {
    const model = buildHeaderViewModel({
      locale: "en",
      navItems: getNavItems(t),
      footerItems: getFooterItems(t),
      labels,
      moreLabel: "More",
    });
    const toolsItem = model.navItems.find((item) => item.title === "tools");

    expect(toolsItem?.items).toHaveLength(3);
    expect(toolsItem?.items?.every((item) => !item.featured)).toBe(true);
  });
});
