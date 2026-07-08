import { describe, expect, it } from "vitest";
import { sortCollectionItems } from "~/app/[locale]/(pages)/u/_components/collection/sort-collection-items";
import type { GearItem } from "~/types/gear";

function makeItem(params: {
  id: string;
  name: string;
  gearType: string;
  brandName?: string | null;
  releaseDate?: string | null;
  sortOrder?: number | null;
  focalLengthMinMm?: number | null;
  focalLengthMaxMm?: number | null;
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
          sortOrder: params.sortOrder ?? null,
        } as GearItem["brands"])
      : null,
    lensSpecs:
      params.focalLengthMinMm !== undefined ||
      params.focalLengthMaxMm !== undefined
        ? ({
            gearId: params.id,
            focalLengthMinMm: params.focalLengthMinMm ?? null,
            focalLengthMaxMm: params.focalLengthMaxMm ?? null,
          } as GearItem["lensSpecs"])
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

  it("respects manual brand order before release date within the same type", () => {
    const sorted = sortCollectionItems([
      makeItem({
        id: "nikon-newer",
        name: "Zf",
        gearType: "CAMERA",
        brandName: "Nikon",
        releaseDate: "2023-09-20",
        sortOrder: 2,
      }),
      makeItem({
        id: "canon-older",
        name: "EOS R6",
        gearType: "CAMERA",
        brandName: "Canon",
        releaseDate: "2020-07-09",
        sortOrder: 1,
      }),
    ]);

    expect(sorted.map((item) => item.id)).toEqual([
      "canon-older",
      "nikon-newer",
    ]);
  });

  it("places the camera brand group with the most items first", () => {
    const sorted = sortCollectionItems([
      makeItem({
        id: "canon-new",
        name: "EOS R5 II",
        gearType: "CAMERA",
        brandName: "Canon",
        releaseDate: "2024-07-17",
        sortOrder: 1,
      }),
      makeItem({
        id: "nikon-old",
        name: "Z6",
        gearType: "CAMERA",
        brandName: "Nikon",
        releaseDate: "2018-08-23",
        sortOrder: 2,
      }),
      makeItem({
        id: "nikon-new",
        name: "Zf",
        gearType: "CAMERA",
        brandName: "Nikon",
        releaseDate: "2023-09-20",
        sortOrder: 2,
      }),
    ]);

    expect(sorted.map((item) => item.id)).toEqual([
      "nikon-new",
      "nikon-old",
      "canon-new",
    ]);
  });

  it("sorts lenses by brand and then focal length low to high before release date", () => {
    const sorted = sortCollectionItems([
      makeItem({
        id: "nikon-400",
        name: "NIKKOR Z 400mm f/4.5 VR S",
        gearType: "LENS",
        brandName: "Nikon",
        releaseDate: "2022-06-29",
        focalLengthMinMm: 400,
        focalLengthMaxMm: 400,
      }),
      makeItem({
        id: "canon-400",
        name: "RF 400mm F2.8L IS USM",
        gearType: "LENS",
        brandName: "Canon",
        releaseDate: "2021-04-14",
        focalLengthMinMm: 400,
        focalLengthMaxMm: 400,
      }),
      makeItem({
        id: "nikon-14-30",
        name: "NIKKOR Z 14-30mm f/4 S",
        gearType: "LENS",
        brandName: "Nikon",
        releaseDate: "2019-01-08",
        focalLengthMinMm: 14,
        focalLengthMaxMm: 30,
      }),
      makeItem({
        id: "canon-35",
        name: "RF 35mm F1.8 Macro IS STM",
        gearType: "LENS",
        brandName: "Canon",
        releaseDate: "2018-09-05",
        focalLengthMinMm: 35,
        focalLengthMaxMm: 35,
      }),
    ]);

    expect(sorted.map((item) => item.id)).toEqual([
      "canon-35",
      "canon-400",
      "nikon-14-30",
      "nikon-400",
    ]);
  });

  it("places the lens brand group with the most items first", () => {
    const sorted = sortCollectionItems([
      makeItem({
        id: "canon-35",
        name: "RF 35mm F1.8 Macro IS STM",
        gearType: "LENS",
        brandName: "Canon",
        releaseDate: "2018-09-05",
        sortOrder: 1,
        focalLengthMinMm: 35,
        focalLengthMaxMm: 35,
      }),
      makeItem({
        id: "nikon-50",
        name: "AF-S NIKKOR 50mm f/1.8G",
        gearType: "LENS",
        brandName: "Nikon",
        releaseDate: "2011-04-27",
        sortOrder: 2,
        focalLengthMinMm: 50,
        focalLengthMaxMm: 50,
      }),
      makeItem({
        id: "nikon-40",
        name: "NIKKOR Z 40mm f/2",
        gearType: "LENS",
        brandName: "Nikon",
        releaseDate: "2021-09-14",
        sortOrder: 2,
        focalLengthMinMm: 40,
        focalLengthMaxMm: 40,
      }),
    ]);

    expect(sorted.map((item) => item.id)).toEqual([
      "nikon-40",
      "nikon-50",
      "canon-35",
    ]);
  });

  it("places lenses without focal length after lenses with focal length", () => {
    const sorted = sortCollectionItems([
      makeItem({
        id: "unknown-lens",
        name: "Repurposed Disposable Camera Lens",
        gearType: "LENS",
        brandName: "Retropia",
        releaseDate: "2024-01-01",
      }),
      makeItem({
        id: "known-lens",
        name: "NIKKOR Z 40mm f/2",
        gearType: "LENS",
        brandName: "Nikon",
        releaseDate: "2021-09-14",
        focalLengthMinMm: 40,
        focalLengthMaxMm: 40,
      }),
    ]);

    expect(sorted.map((item) => item.id)).toEqual([
      "known-lens",
      "unknown-lens",
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
