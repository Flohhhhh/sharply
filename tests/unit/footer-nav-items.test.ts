import { describe,expect,it } from "vitest";
import { getAllNavItems,getFooterItems } from "~/lib/nav-items";

const t = (key: string) => key;

describe("getFooterItems", () => {
  it("includes Search as a standalone link directly after News", () => {
    const footerItems = getFooterItems(t);

    expect(footerItems.bottomLinks).toEqual(
      expect.arrayContaining([
        { name: "news", href: "/news" },
        { name: "search", href: "/search" },
      ]),
    );
    expect(
      footerItems.bottomLinks.findIndex((link) => link.href === "/search"),
    ).toBe(
      footerItems.bottomLinks.findIndex((link) => link.href === "/news") + 1,
    );
    expect(
      footerItems.sections.some((section) => section.title === "search"),
    ).toBe(false);
  });

  it("excludes items marked hideFromFooter from the footer navigation groups", () => {
    const footerItems = getFooterItems(t);
    const excludedFooterLinks = getAllNavItems()
      .filter((item) => item.type === "link" && item.hideFromFooter)
      .map((item) => item.url);

    expect(excludedFooterLinks.length).toBeGreaterThan(0);

    for (const href of excludedFooterLinks) {
      expect(footerItems.bottomLinks).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ href })]),
      );
    }
  });
});
