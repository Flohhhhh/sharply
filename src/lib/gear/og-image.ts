export const GEAR_OG_WIDTH = 1200;
export const GEAR_OG_HEIGHT = 630;
export const GEAR_OG_PADDING = 64;
export const GEAR_OG_BACKGROUND = "#18181b";
export const GEAR_OG_JPEG_QUALITY = 0.9;

export type GearImageType = "thumbnail" | "topView" | "rearView";

export function shouldAutoGenerateGearOgImageOnThumbnailUpload(params: {
  imageType: GearImageType;
  currentThumbnailUrl?: string | null;
}) {
  return (
    params.imageType === "thumbnail" &&
    !(params.currentThumbnailUrl ?? "").trim()
  );
}

export function getGearOgImageDrawRect(params: {
  sourceWidth: number;
  sourceHeight: number;
  width?: number;
  height?: number;
  padding?: number;
}) {
  const width = params.width ?? GEAR_OG_WIDTH;
  const height = params.height ?? GEAR_OG_HEIGHT;
  const padding = params.padding ?? GEAR_OG_PADDING;
  const availableWidth = width - padding * 2;
  const availableHeight = height - padding * 2;

  if (
    params.sourceWidth <= 0 ||
    params.sourceHeight <= 0 ||
    availableWidth <= 0 ||
    availableHeight <= 0
  ) {
    throw new Error("Invalid gear OG image dimensions");
  }

  const scale = Math.min(
    availableWidth / params.sourceWidth,
    availableHeight / params.sourceHeight,
  );
  const drawWidth = params.sourceWidth * scale;
  const drawHeight = params.sourceHeight * scale;

  return {
    x: (width - drawWidth) / 2,
    y: (height - drawHeight) / 2,
    width: drawWidth,
    height: drawHeight,
  };
}

async function loadBlobFromSource(source: Blob | string) {
  if (typeof source === "string") {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Failed to fetch source image (${response.status})`);
    }
    return await response.blob();
  }

  return source;
}

async function loadImageElement(source: Blob) {
  if (typeof Image === "undefined" || typeof URL === "undefined") {
    throw new Error("Image generation is only available in the browser");
  }

  const objectUrl = URL.createObjectURL(source);

  try {
    const image = new Image();
    image.decoding = "async";

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Failed to decode source image"));
      image.src = objectUrl;
    });

    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function canvasToJpegBlob(canvas: HTMLCanvasElement) {
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("Failed to export gear OG image"));
      },
      "image/jpeg",
      GEAR_OG_JPEG_QUALITY,
    );
  });
}

export async function createGearOgImageFileFromSource(params: {
  source: Blob | string;
  fileNameStem: string;
}) {
  if (typeof document === "undefined") {
    throw new Error("Gear OG image generation requires a browser document");
  }

  const sourceBlob = await loadBlobFromSource(params.source);
  const image = await loadImageElement(sourceBlob);
  const canvas = document.createElement("canvas");
  canvas.width = GEAR_OG_WIDTH;
  canvas.height = GEAR_OG_HEIGHT;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Failed to create gear OG image context");
  }

  context.fillStyle = GEAR_OG_BACKGROUND;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const rect = getGearOgImageDrawRect({
    sourceWidth: image.naturalWidth,
    sourceHeight: image.naturalHeight,
  });

  context.drawImage(image, rect.x, rect.y, rect.width, rect.height);

  const blob = await canvasToJpegBlob(canvas);
  return new File([blob], `${params.fileNameStem}.jpg`, {
    type: "image/jpeg",
  });
}
