import { z } from "zod";
import type { CameraVideoMode } from "~/types/gear";

export const MAX_VIDEO_MODES = 200;

const nullableNumber = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === null || value === undefined || value === "") return null;
    const num = typeof value === "number" ? value : Number(value);
    return Number.isFinite(num) ? num : null;
  });

const booleanLike = z
  .union([z.boolean(), z.string(), z.number(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (typeof value === "string") {
      const trimmed = value.trim().toLowerCase();
      return trimmed === "true" || trimmed === "1" || trimmed === "on";
    }
    return false;
  });

export const videoModeInputSchema = z.object({
  resolutionKey: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => {
      if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed.length ? trimmed : undefined;
      }
      return undefined;
    })
    .optional(),
  resolutionLabel: z
    .string()
    .min(1)
    .max(120)
    .transform((value) => value.trim()),
  resolutionHorizontal: nullableNumber,
  resolutionVertical: nullableNumber,
  fps: z.coerce.number().int().min(1).max(960),
  codecLabel: z
    .string()
    .min(1)
    .max(120)
    .transform((value) => value.trim()),
  bitDepth: z.coerce.number().int().min(1).max(32),
  cropFactor: booleanLike,
  notes: z
    .union([z.string(), z.null(), z.undefined()])
    .optional()
    .transform((value) => {
      if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed.length ? trimmed : null;
      }
      if (value === null) return null;
      return undefined;
    }),
});

export const videoModesPayloadSchema = z.object({
  modes: z.array(videoModeInputSchema).max(MAX_VIDEO_MODES),
});

export type VideoModeInput = z.infer<typeof videoModeInputSchema>;

export type VideoModeNormalized = {
  resolutionKey: string;
  resolutionLabel: string;
  resolutionHorizontal: number | null;
  resolutionVertical: number | null;
  fps: number;
  codecLabel: string;
  bitDepth: number;
  cropFactor: boolean;
  notes: string | null;
};

function sanitizeDimension(value: number | null): number | null {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value)) return null;
  const rounded = Math.round(value);
  return rounded > 0 ? rounded : null;
}

export function slugifyResolutionKey(raw?: string | null) {
  const fallback = (raw ?? "").trim().toLowerCase();
  const slug = fallback
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return slug.length ? slug : "custom";
}

export function compareVideoModes(
  a: VideoModeNormalized,
  b: VideoModeNormalized,
) {
  if (a.resolutionKey !== b.resolutionKey) {
    return a.resolutionKey.localeCompare(b.resolutionKey);
  }
  if (a.fps !== b.fps) {
    return a.fps - b.fps;
  }
  if (a.bitDepth !== b.bitDepth) {
    return a.bitDepth - b.bitDepth;
  }
  return a.codecLabel.localeCompare(b.codecLabel);
}

export function normalizeVideoModes(
  list: readonly VideoModeInput[],
): VideoModeNormalized[] {
  const normalized = list.map<VideoModeNormalized>((mode) => ({
    resolutionKey: slugifyResolutionKey(
      mode.resolutionKey?.length ? mode.resolutionKey : mode.resolutionLabel,
    ),
    resolutionLabel: mode.resolutionLabel,
    resolutionHorizontal: sanitizeDimension(mode.resolutionHorizontal ?? null),
    resolutionVertical: sanitizeDimension(mode.resolutionVertical ?? null),
    fps: Number(mode.fps),
    codecLabel: mode.codecLabel,
    bitDepth: Number(mode.bitDepth),
    cropFactor: Boolean(mode.cropFactor),
    notes: mode.notes ?? null,
  }));
  return normalized.sort(compareVideoModes);
}

export function coerceVideoModeList(
  value: unknown,
  { strict = false }: { strict?: boolean } = {},
): VideoModeNormalized[] {
  if (!Array.isArray(value)) return [];
  const parsed: VideoModeInput[] = [];
  value.forEach((candidate, index) => {
    const result = videoModeInputSchema.safeParse(candidate ?? {});
    if (result.success) {
      parsed.push(result.data);
      return;
    }
    if (strict) {
      throw new Error(
        `Invalid video mode at index ${index}: ${result.error.message}`,
      );
    }
  });
  if (parsed.length > MAX_VIDEO_MODES) {
    return normalizeVideoModes(parsed.slice(0, MAX_VIDEO_MODES));
  }
  return normalizeVideoModes(parsed);
}

export function videoModesEqual(
  a: VideoModeNormalized[],
  b: VideoModeNormalized[],
): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    const left = a[i]!;
    const right = b[i]!;
    if (
      left.resolutionKey !== right.resolutionKey ||
      left.resolutionLabel !== right.resolutionLabel ||
      left.resolutionHorizontal !== right.resolutionHorizontal ||
      left.resolutionVertical !== right.resolutionVertical ||
      left.fps !== right.fps ||
      left.codecLabel !== right.codecLabel ||
      left.bitDepth !== right.bitDepth ||
      left.cropFactor !== right.cropFactor ||
      left.notes !== right.notes
    ) {
      return false;
    }
  }
  return true;
}

export function normalizedToCameraVideoModes(
  modes: VideoModeNormalized[],
  opts?: { gearId?: string },
): CameraVideoMode[] {
  const gearId = opts?.gearId ?? "preview";
  return modes.map((mode, index) => ({
    id: mode.resolutionKey
      ? `${mode.resolutionKey}-${mode.fps}-${mode.bitDepth}-${index}`
      : `preview-${index}`,
    gearId,
    resolutionKey: mode.resolutionKey,
    resolutionLabel: mode.resolutionLabel,
    resolutionHorizontal: mode.resolutionHorizontal,
    resolutionVertical: mode.resolutionVertical,
    fps: mode.fps,
    codecLabel: mode.codecLabel,
    bitDepth: mode.bitDepth,
    cropFactor: mode.cropFactor,
    notes: mode.notes,
    createdAt: new Date(0),
    updatedAt: new Date(0),
  }));
}
