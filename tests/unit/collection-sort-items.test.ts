import { describe, expect, it } from "vitest";
import { sortCollectionItems } from "~/app/[locale]/(pages)/u/_components/collection/sort-collection-items";
import type { GearItem } from "~/types/gear";

function makeItem(params: {
  id: string;
  name: string;
  gearType: string;
  brandName?: string | null;
  releaseDate?: string | null;
}): GearItem {
  return {
    id: params.id,
    slug: params.id,
    name: params.name,
    gearType: params.gearType as GearItem["gearType"],
    brandId: params.brandName ? `${params.brandName}-id` : null,
    releaseDate: params.releaseDate ?? null,
    brands: params.brandName
      ? ({
          id: `${params.brandName}-id`,
          name: params.brandName,
          slug: params.brandName.toLowerCase(),
        } as GearItem["brands"])
      : null,
  } as GearItem;
}

describe("sortCollectionItems", () => {
  it("keeps type priority before brand grouping", () => {
    const sorted = sortCollectionItems([
      makeItem({
        id: "lens-canon",
        name: "RF 50mm F1.8 STM",
        gearType: "LENS",
        brandName: "Canon",
        releaseDate: "2020-11-04",
      }),
      makeItem({
        id: "camera-nikon",
        name: "Zf",
        gearType: "CAMERA",
        brandName: "Nikon",
        releaseDate: "2023-09-20",
      }),
      makeItem({
        id: "other-sigma",
        name: "Flash",
        gearType: "FLASH",
        brandName: "Sigma",
        releaseDate: "2024-01-01",
      }),
      makeItem({
        id: "camera-canon",
        name: "EOS R5 II",
        gearType: "CAMERA",
        brandName: "Canon",
        releaseDate: "2024-07-17",
      }),
    ]);

    expect(sorted.map((item) => item.id)).toEqual([
      "camera-canon",
      "camera-nikon",
      "lens-canon",
      "other-sigma",
    ]);
  });

  it("sorts items within the same type and brand by newest release date first", () => {
    const sorted = sortCollectionItems([
      makeItem({
        id: "canon-old",
        name: "EOS R6",
        gearType: "CAMERA",
        brandName: "Canon",
        releaseDate: "2020-07-09",
      }),
      makeItem({
        id: "canon-missing-date",
        name: "EOS R",
        gearType: "CAMERA",
        brandName: "Canon",
      }),
      makeItem({
        id: "canon-new",
        name: "EOS R5 II",
        gearType: "CAMERA",
        brandName: "Canon",
        releaseDate: "2024-07-17",
      }),
    ]);

    expect(sorted.map((item) => item.id)).toEqual([
      "canon-new",
      "canon-old",
      "canon-missing-date",
    ]);
  });

  it("falls back to name when type, brand, and release date are tied", () => {
    const sorted = sortCollectionItems([
      makeItem({
        id: "b-item",
        name: "B Lens",
        gearType: "LENS",
        brandName: "Sony",
        releaseDate: "2024-01-01",
      }),
      makeItem({
        id: "a-item",
        name: "A Lens",
        gearType: "LENS",
        brandName: "Sony",
        releaseDate: "2024-01-01",
      }),
    ]);

    expect(sorted.map((item) => item.id)).toEqual(["a-item", "b-item"]);
  });
});
