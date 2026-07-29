import { describe, expect, it } from "vitest";
import { filterTagGear } from "~/lib/tags/filter-tag-gear";

const gear = [
  {
    name: "Canon RF 100-500mm F4.5-7.1 L IS USM",
    slug: "canon-rf-100-500",
    brandName: "Canon",
  },
  {
    name: "Sony FE 200-600mm F5.6-6.3 G OSS",
    slug: "sony-fe-200-600",
    brandName: "Sony",
  },
  {
    name: "Nikon Z 180-600mm f/5.6-6.3 VR",
    slug: "nikon-z-180-600",
    brandName: null,
  },
];

describe("filterTagGear", () => {
  it("returns every item for an empty query", () => {
    expect(filterTagGear(gear, "  ")).toEqual(gear);
  });

  it("matches a gear name, brand, or slug without case sensitivity", () => {
    expect(filterTagGear(gear, "SONY")).toEqual([gear[1]]);
    expect(filterTagGear(gear, "nikon-z")).toEqual([gear[2]]);
  });
});
