export const collectionCardMinWidthPixels = 240;
export const collectionImageMinStageHeightPixels = 200;
export const collectionCameraPixelsPerMillimeter = 1.8;
export const collectionPlaceholderSizePixels = 200;

export function getCollectionCardWidthPixels(displayWidthPixels: number) {
  return Math.max(
    collectionCardMinWidthPixels,
    Math.round(displayWidthPixels),
  );
}

export function getCollectionImageStageHeightPixels(
  displayHeightPixels: number[],
) {
  const tallestDisplayHeightPixels = displayHeightPixels.reduce(
    (tallest, current) => Math.max(tallest, Math.round(current)),
    0,
  );

  return Math.max(
    collectionImageMinStageHeightPixels,
    tallestDisplayHeightPixels,
  );
}

export function shouldShowCollectionScaleEstimate(params: {
  hasImage: boolean;
  isCamera: boolean;
  isScaleEstimated: boolean;
}) {
  const { hasImage, isCamera, isScaleEstimated } = params;
  return hasImage && isCamera && isScaleEstimated;
}
