import "server-only";

import { z } from "zod";
import { requireRole } from "~/lib/auth/auth-helpers";
import { getSessionOrThrow } from "~/server/auth";
import {
  fetchActiveApprovedCreatorsData,
  fetchApprovedCreatorByIdData,
  fetchApprovedCreatorsData,
  fetchGearSlugsByCreatorIdData,
  insertApprovedCreatorData,
  setApprovedCreatorActiveData,
  updateApprovedCreatorData,
  type ApprovedCreatorPlatform,
} from "./data";

export type { ApprovedCreatorRow } from "./data";

const approvedCreatorInput = z.object({
  name: z.string().trim().min(1).max(200),
  platform: z.literal("YOUTUBE"),
  channelUrl: z.string().trim().url(),
  avatarUrl: z.string().trim().url().optional().or(z.literal("")),
  internalNotes: z.string().trim().max(2000).optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export async function fetchApprovedCreatorsAdmin() {
  const session = await getSessionOrThrow();
  if (!requireRole(session.user, ["ADMIN"])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }

  return fetchApprovedCreatorsData();
}

export async function fetchActiveApprovedCreatorsForPlatform(
  platform: ApprovedCreatorPlatform,
) {
  return fetchActiveApprovedCreatorsData(platform);
}

export async function fetchApprovedCreatorById(id: string) {
  return fetchApprovedCreatorByIdData(id);
}

export async function createApprovedCreatorAdmin(input: unknown) {
  const session = await getSessionOrThrow();
  if (!requireRole(session.user, ["ADMIN"])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }

  const parsed = approvedCreatorInput.parse(input);
  const creator = await insertApprovedCreatorData({
    ...parsed,
    avatarUrl: parsed.avatarUrl || null,
    internalNotes: parsed.internalNotes || null,
  });

  if (!creator) {
    throw new Error("Failed to create creator");
  }

  return creator;
}

export async function updateApprovedCreatorAdmin(
  id: string,
  input: unknown,
) {
  const session = await getSessionOrThrow();
  if (!requireRole(session.user, ["ADMIN"])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }

  const parsed = approvedCreatorInput.parse(input);
  const creator = await updateApprovedCreatorData({
    id,
    ...parsed,
    avatarUrl: parsed.avatarUrl || null,
    internalNotes: parsed.internalNotes || null,
  });

  if (!creator) {
    throw Object.assign(new Error("Approved creator not found"), { status: 404 });
  }

  return creator;
}

export async function setApprovedCreatorActiveAdmin(params: {
  id: string;
  isActive: boolean;
}) {
  const session = await getSessionOrThrow();
  if (!requireRole(session.user, ["ADMIN"])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }

  const updated = await setApprovedCreatorActiveData(params);
  if (!updated) {
    throw Object.assign(new Error("Approved creator not found"), { status: 404 });
  }

  return updated;
}

export async function fetchGearSlugsByCreatorId(id: string) {
  return fetchGearSlugsByCreatorIdData(id);
}
