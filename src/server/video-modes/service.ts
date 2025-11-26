import "server-only";

import { z } from "zod";
import { requireUser, type SessionRole } from "~/server/auth";
import { getGearIdBySlug as getGearIdBySlugData } from "~/server/gear/data";
import {
  fetchVideoModesByGearId,
  replaceVideoModesForGear,
  type CameraVideoModeRow,
} from "./data";

const MAX_VIDEO_MODES = 200;
const EDIT_ROLES: SessionRole[] = ["ADMIN", "EDITOR"];

const nullableNumber = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) return null;
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? value : parsed;
    }
    return value;
  },
  z.number().finite().nullable(),
);

const booleanLike = z.preprocess(
  (value) => {
    if (value === true || value === false) return value;
    if (value === "" || value === null || value === undefined) return false;
    if (value === "true" || value === "1" || value === 1) return true;
    if (value === "false" || value === "0" || value === 0) return false;
    return value;
  },
  z.boolean(),
);

const videoModeInput = z.object({
  resolutionKey: z
    .string()
    .max(64)
    .optional()
    .transform((value) => value?.trim())
    .pipe(z.string().max(64).optional()),
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
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((value) => (value && value.length ? value : null)),
});

const videoModesPayload = z.object({
  modes: z.array(videoModeInput).max(MAX_VIDEO_MODES),
});

function assertCanEdit(role: SessionRole | undefined) {
  if (!role || !EDIT_ROLES.includes(role)) {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }
}

function slugifyResolutionKey(raw: string) {
  const fallback = raw.trim().toLowerCase();
  const slug = fallback
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return slug.length ? slug : "custom";
}

async function resolveGearIdOrThrow(slug: string) {
  const gearId = await getGearIdBySlugData(slug);
  if (!gearId) {
    throw Object.assign(new Error("Gear not found"), { status: 404 });
  }
  return gearId;
}

export async function getVideoModesForGearSlug(slug: string) {
  const gearId = await resolveGearIdOrThrow(slug);
  const modes = await fetchVideoModesByGearId(gearId);
  return { gearId, modes };
}

export async function saveVideoModesForGearSlug(
  slug: string,
  payload: unknown,
) {
  const { user } = await requireUser();
  assertCanEdit(user.role);

  const gearId = await resolveGearIdOrThrow(slug);
  const parsed = videoModesPayload.parse(payload ?? {});

  const normalized = parsed.modes.map((mode) => ({
    gearId,
    resolutionKey: slugifyResolutionKey(
      mode.resolutionKey && mode.resolutionKey.length
        ? mode.resolutionKey
        : mode.resolutionLabel,
    ),
    resolutionLabel: mode.resolutionLabel,
    resolutionHorizontal:
      mode.resolutionHorizontal &&
      Number.isFinite(mode.resolutionHorizontal) &&
      mode.resolutionHorizontal > 0
        ? Math.trunc(mode.resolutionHorizontal)
        : null,
    resolutionVertical:
      mode.resolutionVertical &&
      Number.isFinite(mode.resolutionVertical) &&
      mode.resolutionVertical > 0
        ? Math.trunc(mode.resolutionVertical)
        : null,
    fps: mode.fps,
    codecLabel: mode.codecLabel,
    bitDepth: mode.bitDepth,
    cropFactor: Boolean(mode.cropFactor),
    notes: mode.notes ?? null,
  }));

  await replaceVideoModesForGear(gearId, normalized);
  return { ok: true as const, count: normalized.length };
}

export async function rebuildVideoSummariesForSlug(slug: string) {
  const gearId = await resolveGearIdOrThrow(slug);
  const modes = await fetchVideoModesByGearId(gearId);
  return {
    ok: true as const,
    gearId,
    modes,
  };
}

