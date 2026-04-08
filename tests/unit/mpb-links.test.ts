import { describe, expect, it } from "vitest";

import { MOUNTS } from "~/lib/constants";
import {
  buildMpbPathForMount,
  getMpbDestinationUrl,
  MPB_MOUNT_PATHS_MAP,
  normalizeMpbLinkInput,
} from "~/lib/links/mpb";

const NIKON_F_MOUNT_ID = "1e930c0c-aadb-4dd3-93ae-7f691cc93296";

describe("MPB link helpers", () => {
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
    ).toBe("https://www.mpb.com/en-uk/product/nikon-z6-iii?sort=price#details");
  });

  it("normalizes mount-specific product URLs to a base path", () => {
    expect(
      normalizeMpbLinkInput(
        "https://www.mpb.com/en-us/product/sigma-24-70mm-f-2-8-dg-dn-art-sony-fe-fit",
      ),
    ).toEqual({
      kind: "product",
      normalizedPath: "/product/sigma-24-70mm-f-2-8-dg-dn-art",
      originalPath: "/product/sigma-24-70mm-f-2-8-dg-dn-art-sony-fe-fit",
      wasNormalized: true,
    });
  });

  it("normalizes market-prefixed relative URLs to a base path", () => {
    expect(
      normalizeMpbLinkInput("/en-us/product/nikon-af-s-50mm-f-1-8g-nikon-fit"),
    ).toEqual({
      kind: "product",
      normalizedPath: "/product/nikon-af-s-50mm-f-1-8g",
      originalPath: "/product/nikon-af-s-50mm-f-1-8g-nikon-fit",
      wasNormalized: true,
    });
  });

  it("rejects MPB search URLs during normalization", () => {
    expect(
      normalizeMpbLinkInput("https://www.mpb.com/en-us/search?q=canon+ef+50mm"),
    ).toEqual({
      kind: "search",
      originalPath: "/search?q=canon+ef+50mm",
    });
  });

  it("rejects non-product MPB paths during normalization", () => {
    expect(
      normalizeMpbLinkInput("https://www.mpb.com/en-us/help/shipping"),
    ).toEqual({
      kind: "invalid",
      originalPath: "/help/shipping",
    });
  });

  it("appends a mapped mount suffix to the base path", () => {
    expect(
      buildMpbPathForMount("/product/nikon-af-s-50mm-f-1-8g", NIKON_F_MOUNT_ID),
    ).toBe("/product/nikon-af-s-50mm-f-1-8g-nikon-fit");
  });

  it("returns null when no suffix exists for the requested mount", () => {
    expect(
      buildMpbPathForMount(
        "/product/nikon-af-s-50mm-f-1-8g",
        "00000000-0000-0000-0000-000000000000",
      ),
    ).toBeNull();
  });

  it("builds a market-aware URL for a selected mount", () => {
    expect(
      getMpbDestinationUrl({
        market: "EU",
        destinationPath: "/product/nikon-af-s-50mm-f-1-8g",
        mountId: NIKON_F_MOUNT_ID,
      }),
    ).toBe(
      "https://www.mpb.com/en-eu/product/nikon-af-s-50mm-f-1-8g-nikon-fit",
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

  it("fails when a mapped mount value is not present in generated mounts", () => {
    const mountValues = new Set(
      (MOUNTS as Array<{ value: string }>).map((mount) => mount.value),
    );
    const unknownMappedValues = Object.keys(MPB_MOUNT_PATHS_MAP).filter(
      (value) => !mountValues.has(value),
    );

    expect(unknownMappedValues).toEqual([]);
  });

  it("tracks unmapped generated mount values", () => {
    const mappedValues = new Set(Object.keys(MPB_MOUNT_PATHS_MAP));
    const unmappedMountValues = (MOUNTS as Array<{ value: string }>)
      .map((mount) => mount.value)
      .filter((value) => !mappedValues.has(value))
      .sort();

    expect(unmappedMountValues).toMatchInlineSnapshot(`
      [
        "a-minolta",
        "fixed-lens",
        "m42-zeiss",
        "m645-mamiya",
        "s-nikon",
        "sr-minolta",
      ]
    `);
  });
});
