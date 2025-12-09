import "server-only";

import { requireUser, requireRole, type UserRole } from "~/server/auth";
import { getGearIdBySlug as getGearIdBySlugData } from "~/server/gear/data";
import {
  fetchVideoModesByGearId,
  replaceVideoModesForGear,
  type CameraVideoModeRow,
} from "./data";
import {
  videoModesPayloadSchema,
  normalizeVideoModes,
  slugifyResolutionKey,
} from "~/lib/video/mode-schema";
const EDIT_ROLES: UserRole[] = ["EDITOR"];

function assertCanEdit(role: UserRole | undefined) {
  if (!role || !requireRole({ user: { role } }, EDIT_ROLES)) {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }
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
  const parsed = videoModesPayloadSchema.parse(payload ?? {});
  const normalizedModes = normalizeVideoModes(parsed.modes);
  const normalized = normalizedModes.map((mode) => ({
    gearId,
    resolutionKey: slugifyResolutionKey(mode.resolutionKey),
    resolutionLabel: mode.resolutionLabel,
    resolutionHorizontal: mode.resolutionHorizontal,
    resolutionVertical: mode.resolutionVertical,
    fps: mode.fps,
    codecLabel: mode.codecLabel,
    bitDepth: mode.bitDepth,
    cropFactor: mode.cropFactor,
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
