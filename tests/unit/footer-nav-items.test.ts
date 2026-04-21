import { describe,expect,it } from "vitest";
import { getAllNavItems,getFooterItems } from "~/lib/nav-items";

const t = (key: string) => key;

describe("getFooterItems", () => {
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
