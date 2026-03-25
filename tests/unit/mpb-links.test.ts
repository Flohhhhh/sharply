import { describe, expect, it } from "vitest";

import { getMpbDestinationUrl } from "~/lib/links/mpb";

describe("getMpbDestinationUrl", () => {
  it("rewrites relative paths into the selected market storefront", () => {
    expect(
      getMpbDestinationUrl({
        market: "EU",
        destinationPath: "/product/nikon-z6-iii",
      }),
    ).toBe("https://www.mpb.com/en-eu/product/nikon-z6-iii");
  });

  it("rewrites absolute MPB URLs into the selected market storefront", () => {
    expect(
      getMpbDestinationUrl({
        market: "UK",
        destinationPath:
          "https://www.mpb.com/en-us/product/nikon-z6-iii?sort=price#details",
      }),
    ).toBe(
      "https://www.mpb.com/en-uk/product/nikon-z6-iii?sort=price#details",
    );
  });

  it("rejects non-MPB absolute URLs", () => {
    expect(() =>
      getMpbDestinationUrl({
        market: "US",
        destinationPath: "https://example.com/product/nikon-z6-iii",
      }),
    ).toThrow("MPB destination must use an MPB hostname.");
  });
});
