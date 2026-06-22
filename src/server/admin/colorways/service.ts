import "server-only";

import slugify from "slugify";

import { requireRole } from "~/lib/auth/auth-helpers";
import { getSessionOrThrow } from "~/server/auth";
import {
  createGearColorwayData,
  deleteGearColorwayData,
  enableGearColorwaysData,
  reorderGearColorwaysData,
  resetGearColorwaysData,
  setGearColorwayImageData,
  updateGearColorwayData,
  type ColorwayImageType,
  type ColorwayResetMode,
} from "./data";

const HEX_COLOR = /^#[0-9A-F]{6}$/;

function normalizeName(name: string) {
  const normalized = name.trim().replace(/\s+/g, " ");
  if (!normalized || normalized.length > 120) {
    throw Object.assign(
      new Error("Enter a colorway name up to 120 characters"),
      { status: 400 },
    );
  }
  return normalized;
}

export function normalizeSwatchColor(value: string) {
  const normalized = value.trim().toUpperCase();
  if (!HEX_COLOR.test(normalized)) {
    throw Object.assign(new Error("Swatch colors must use #RRGGBB format"), {
      status: 400,
    });
  }
  return normalized;
}

function colorwayInput(input: {
  name: string;
  swatchColorA: string;
  swatchColorB: string;
}) {
  const name = normalizeName(input.name);
  const slug = slugify(name, { lower: true, strict: true }) || "color";
  return {
    name,
    slug,
    swatchColorA: normalizeSwatchColor(input.swatchColorA),
    swatchColorB: normalizeSwatchColor(input.swatchColorB),
  };
}

async function editorSession() {
  const session = await getSessionOrThrow();
  if (!requireRole(session.user, ["ADMIN", "EDITOR"])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  return session;
}

async function adminSession() {
  const session = await getSessionOrThrow();
  if (!requireRole(session.user, ["ADMIN"])) {
    throw Object.assign(new Error("Administrator access required"), {
      status: 403,
    });
  }
  return session;
}

export async function enableGearColorwaysService(params: {
  gearId: string;
  name: string;
  swatchColorA: string;
  swatchColorB: string;
}) {
  const session = await editorSession();
  return enableGearColorwaysData({
    gearId: params.gearId,
    actorUserId: session.user.id,
    input: colorwayInput(params),
  });
}

export async function createGearColorwayService(params: {
  gearId: string;
  name: string;
  swatchColorA: string;
  swatchColorB: string;
}) {
  const session = await editorSession();
  return createGearColorwayData({
    gearId: params.gearId,
    actorUserId: session.user.id,
    input: colorwayInput(params),
  });
}

export async function updateGearColorwayService(params: {
  gearId: string;
  colorwayId: string;
  name: string;
  swatchColorA: string;
  swatchColorB: string;
}) {
  const session = await editorSession();
  return updateGearColorwayData({
    gearId: params.gearId,
    colorwayId: params.colorwayId,
    actorUserId: session.user.id,
    name: normalizeName(params.name),
    swatchColorA: normalizeSwatchColor(params.swatchColorA),
    swatchColorB: normalizeSwatchColor(params.swatchColorB),
  });
}

export async function reorderGearColorwaysService(params: {
  gearId: string;
  orderedIds: string[];
}) {
  const session = await editorSession();
  if (
    !params.orderedIds.length ||
    new Set(params.orderedIds).size !== params.orderedIds.length
  ) {
    throw Object.assign(new Error("Colorway order is invalid"), {
      status: 400,
    });
  }
  return reorderGearColorwaysData({ ...params, actorUserId: session.user.id });
}

export async function deleteGearColorwayService(params: {
  gearId: string;
  colorwayId: string;
}) {
  const session = await adminSession();
  return deleteGearColorwayData({ ...params, actorUserId: session.user.id });
}

export async function resetGearColorwaysService(params: {
  gearId: string;
  mode: ColorwayResetMode;
  colorwayId?: string;
}) {
  const session = await adminSession();
  if (params.mode !== "keepGearImages" && params.mode !== "applyColorway") {
    throw Object.assign(new Error("Invalid reset mode"), { status: 400 });
  }
  return resetGearColorwaysData({ ...params, actorUserId: session.user.id });
}

export async function setGearColorwayImageService(params: {
  gearId: string;
  colorwayId: string;
  imageType: ColorwayImageType;
  imageUrl: string | null;
  ogImageUrl?: string | null;
}) {
  const session = params.imageUrl
    ? await editorSession()
    : await adminSession();
  if (!["front", "topView", "rearView"].includes(params.imageType)) {
    throw Object.assign(new Error("Invalid image type"), { status: 400 });
  }
  return setGearColorwayImageData({ ...params, actorUserId: session.user.id });
}

export type { ColorwayImageType, ColorwayResetMode } from "./data";
