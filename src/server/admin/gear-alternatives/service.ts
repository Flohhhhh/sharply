import "server-only";

import { requireRole } from "~/lib/auth/auth-helpers";
import { getSessionOrThrow } from "~/server/auth";
import {
  fetchGearAlternativesData,
  addGearAlternativeData,
  removeGearAlternativeData,
  updateGearAlternativeData,
  type GearAlternative,
} from "./data";

export async function fetchGearAlternatives(
  gearId: string,
): Promise<GearAlternative[]> {
  const session = await getSessionOrThrow();
  if (!requireRole(session.user, ["EDITOR"])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  return fetchGearAlternativesData(gearId);
}

export async function addGearAlternative(params: {
  gearId: string;
  alternativeGearId: string;
  isDirectCompetitor: boolean;
}): Promise<void> {
  const session = await getSessionOrThrow();
  if (!requireRole(session.user, ["EDITOR"])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }

  // Prevent self-referencing
  if (params.gearId === params.alternativeGearId) {
    throw Object.assign(
      new Error("Cannot add gear as alternative to itself"),
      { status: 400 },
    );
  }

  return addGearAlternativeData(params);
}

export async function removeGearAlternative(params: {
  gearId: string;
  alternativeGearId: string;
}): Promise<void> {
  const session = await getSessionOrThrow();
  if (!requireRole(session.user, ["EDITOR"])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  return removeGearAlternativeData(params);
}

export async function updateGearAlternative(params: {
  gearId: string;
  alternativeGearId: string;
  isDirectCompetitor: boolean;
}): Promise<void> {
  const session = await getSessionOrThrow();
  if (!requireRole(session.user, ["EDITOR"])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  return updateGearAlternativeData(params);
}
