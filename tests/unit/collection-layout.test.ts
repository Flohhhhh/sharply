import { describe, expect, it } from "vitest";
import {
  collectionCameraPixelsPerMillimeter,
  collectionCardMinWidthPixels,
  collectionImageMinStageHeightPixels,
  collectionPlaceholderSizePixels,
  getCollectionCardWidthPixels,
  getCollectionImageStageHeightPixels,
  shouldShowCollectionScaleEstimate,
} from "~/app/[locale]/(pages)/u/_components/collection/collection-layout";

describe("getCollectionCardWidthPixels", () => {
  it("keeps smaller images aligned to the minimum card width", () => {
    expect(getCollectionCardWidthPixels(180)).toBe(
      collectionCardMinWidthPixels,
    );
  });

  it("preserves larger scaled image widths", () => {
    expect(getCollectionCardWidthPixels(312.4)).toBe(312);
  });
});

describe("collection constants", () => {
  it("uses the updated camera scale factor for dimension-based sizing", () => {
    expect(collectionCameraPixelsPerMillimeter).toBe(1.8);
  });

  it("keeps empty-state placeholders square", () => {
    expect(collectionPlaceholderSizePixels).toBe(200);
  });
});

describe("getCollectionImageStageHeightPixels", () => {
  it("keeps shorter image rows anchored to the minimum stage height", () => {
    expect(getCollectionImageStageHeightPixels([140, 180])).toBe(
      collectionImageMinStageHeightPixels,
    );
  });

  it("uses the tallest scaled image height for the row stage", () => {
    expect(getCollectionImageStageHeightPixels([210.1, 255.8, 199.2])).toBe(
      256,
    );
  });
});

describe("shouldShowCollectionScaleEstimate", () => {
  it("shows the estimate note for scaled camera images", () => {
    expect(
      shouldShowCollectionScaleEstimate({
        hasImage: true,
        isCamera: true,
        isScaleEstimated: true,
      }),
    ).toBe(true);
  });

  it("hides the estimate note when the image is missing", () => {
    expect(
      shouldShowCollectionScaleEstimate({
        hasImage: false,
        isCamera: true,
        isScaleEstimated: true,
      }),
    ).toBe(false);
  });
});
