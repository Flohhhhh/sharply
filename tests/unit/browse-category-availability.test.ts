import { describe,expect,it } from "vitest";

import {
  getBrandCategoryItems,
  getBrowseCategoryAvailability,
  getSingleCategoryBrandBrowseRedirectPath,
} from "~/lib/browse/category-availability";

const labels = {
  cameras: "Cameras",
  lenses: "Lenses",
};

describe("browse category availability", () => {
  it("does not redirect when both categories are available", () => {
    const counts = { cameras: 3, lenses: 7 };

    expect(
      getSingleCategoryBrandBrowseRedirectPath({
        brandSlug: "nikon",
        counts,
      }),
    ).toBeNull();
    expect(getBrowseCategoryAvailability(counts)).toEqual({
      cameras: true,
      lenses: true,
    });
  });

  it("redirects to lenses when only lenses are available", () => {
    expect(
      getSingleCategoryBrandBrowseRedirectPath({
        brandSlug: "rollei",
        counts: { cameras: 0, lenses: 4 },
      }),
    ).toBe("/browse/rollei/lenses");
  });

  it("redirects to cameras when only cameras are available", () => {
    expect(
      getSingleCategoryBrandBrowseRedirectPath({
        brandSlug: "canon",
        counts: { cameras: 5, lenses: 0 },
      }),
    ).toBe("/browse/canon/cameras");
  });

  it("does not redirect and returns no category cards when neither category is available", () => {
    const counts = { cameras: 0, lenses: 0 };
    const availability = getBrowseCategoryAvailability(counts);

    expect(
      getSingleCategoryBrandBrowseRedirectPath({
        brandSlug: "empty-brand",
        counts,
      }),
    ).toBeNull();
    expect(
      getBrandCategoryItems({
        brandSlug: "empty-brand",
        labels,
        availability,
      }),
    ).toEqual([]);
  });

  it("filters brand category cards to available categories", () => {
    expect(
      getBrandCategoryItems({
        brandSlug: "rollei",
        labels,
        availability: { cameras: false, lenses: true },
      }),
    ).toEqual([
      {
        category: "lenses",
        label: "Lenses",
        href: "/browse/rollei/lenses",
      },
    ]);
  });
});
