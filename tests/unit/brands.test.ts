import { describe, expect, it } from "vitest";
import {
  compareBrandsWithPriority,
  orderBrandsWithPriority,
  splitBrandsWithPriority,
} from "~/lib/brands";

describe("brand ordering helpers", () => {
  it("sorts ordered brands before null-order brands", () => {
    const ordered = orderBrandsWithPriority([
      { name: "Sigma", sortOrder: null },
      { name: "Canon", sortOrder: 2 },
      { name: "Nikon", sortOrder: 1 },
    ]);

    expect(ordered.map((brand) => brand.name)).toEqual([
      "Nikon",
      "Canon",
      "Sigma",
    ]);
  });

  it("falls back to alphabetical order when sort values are equal", () => {
    const ordered = orderBrandsWithPriority([
      { name: "Sony", sortOrder: 1 },
      { name: "Canon", sortOrder: 1 },
    ]);

    expect(ordered.map((brand) => brand.name)).toEqual(["Canon", "Sony"]);
  });

  it("keeps null-order brands alphabetical", () => {
    const ordered = orderBrandsWithPriority([
      { name: "Zeiss", sortOrder: null },
      { name: "Canon", sortOrder: null },
      { name: "Nikon", sortOrder: null },
    ]);

    expect(ordered.map((brand) => brand.name)).toEqual([
      "Canon",
      "Nikon",
      "Zeiss",
    ]);
  });

  it("splits ordered and null-order groups for select dividers", () => {
    const groups = splitBrandsWithPriority([
      { name: "Sigma", sortOrder: null },
      { name: "Nikon", sortOrder: 2 },
      { name: "Canon", sortOrder: 1 },
    ]);

    expect(groups.hoisted.map((brand) => brand.name)).toEqual([
      "Canon",
      "Nikon",
    ]);
    expect(groups.remaining.map((brand) => brand.name)).toEqual(["Sigma"]);
  });

  it("supports generated constant snake_case sort keys", () => {
    expect(
      compareBrandsWithPriority(
        { name: "Canon", sort_order: 2 },
        { name: "Nikon", sort_order: null },
      ),
    ).toBeLessThan(0);
  });
});
