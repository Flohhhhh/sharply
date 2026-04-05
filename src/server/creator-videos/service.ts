import "server-only";

import { z } from "zod";
import { requireRole } from "~/lib/auth/auth-helpers";
import { getSessionOrThrow } from "~/server/auth";
import { fetchApprovedCreatorById } from "~/server/admin/approved-creators/service";
import { resolveGearIdOrThrow } from "~/server/gear/service";
import {
  deactivateGearCreatorVideoData,
  fetchManageGearCreatorVideosByGearIdData,
  fetchPublicGearCreatorVideosByGearIdData,
  updateGearCreatorVideoEditorialData,
  upsertGearCreatorVideoData,
} from "./data";
import { resolveCreatorVideoMetadata } from "./metadata";
import { fetchActiveApprovedCreatorsForPlatform } from "~/server/admin/approved-creators/service";
export type { PublicGearCreatorVideoRow } from "./data";

const gearCreatorVideoInput = z.object({
  creatorId: z.string().trim().min(1),
  url: z.string().trim().min(1),
  title: z.string().trim().max(500).optional().or(z.literal("")),
  thumbnailUrl: z.string().trim().url().optional().or(z.literal("")),
  publishedAt: z.string().trim().optional().or(z.literal("")),
  editorNote: z.string().trim().max(1000).optional().or(z.literal("")),
});

const gearCreatorVideoEditorialInput = z.object({
  editorNote: z.string().trim().max(1000).optional().or(z.literal("")),
});

function parseOptionalDate(value: string | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Enter a valid publish date");
  }
  return date;
}

async function requireEditorSession() {
  const session = await getSessionOrThrow();
  if (!requireRole(session.user, ["EDITOR"])) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  return session;
}

export async function fetchPublicGearCreatorVideos(slug: string) {
  const gearId = await resolveGearIdOrThrow(slug);
  return fetchPublicGearCreatorVideosByGearIdData(gearId);
}

export async function fetchManageGearCreatorVideos(slug: string) {
  await requireEditorSession();
  const gearId = await resolveGearIdOrThrow(slug);

  const [videos, creators] = await Promise.all([
    fetchManageGearCreatorVideosByGearIdData(gearId),
    fetchActiveApprovedCreatorsForPlatform("YOUTUBE"),
  ]);

  return { videos, creators };
}

export async function resolveGearCreatorVideoInput(input: unknown) {
  await requireEditorSession();
  const parsed = gearCreatorVideoInput.pick({
    creatorId: true,
    url: true,
  }).parse(input);

  const creator = await fetchApprovedCreatorById(parsed.creatorId);
  if (!creator?.isActive) {
    throw Object.assign(new Error("Select an active approved creator"), {
      status: 400,
    });
  }

  const resolution = await resolveCreatorVideoMetadata(parsed.url);
  if (resolution.platform !== creator.platform) {
    throw Object.assign(new Error("Video platform must match the selected creator"), {
      status: 400,
    });
  }

  return resolution;
}

export async function createGearCreatorVideo(slug: string, input: unknown) {
  const session = await requireEditorSession();
  const parsed = gearCreatorVideoInput.parse(input);
  const gearId = await resolveGearIdOrThrow(slug);
  const creator = await fetchApprovedCreatorById(parsed.creatorId);

  if (!creator?.isActive) {
    throw Object.assign(new Error("Select an active approved creator"), {
      status: 400,
    });
  }

  const resolution = await resolveCreatorVideoMetadata(parsed.url);
  if (resolution.platform !== creator.platform) {
    throw Object.assign(new Error("Video platform must match the selected creator"), {
      status: 400,
    });
  }

  const manualTitle = parsed.title?.trim() || null;
  const manualThumbnailUrl = parsed.thumbnailUrl?.trim() || null;
  const title =
    resolution.metadataStatus === "resolved"
      ? resolution.title
      : manualTitle;

  if (!title) {
    throw Object.assign(
      new Error("Add a video title when automatic metadata lookup fails"),
      { status: 400 },
    );
  }

  const thumbnailUrl =
    resolution.metadataStatus === "resolved"
      ? resolution.thumbnailUrl
      : manualThumbnailUrl ?? resolution.thumbnailUrl;

  const publishedAt = parseOptionalDate(parsed.publishedAt || undefined);

  const video = await upsertGearCreatorVideoData({
    gearId,
    creatorId: creator.id,
    sourceUrl: resolution.sourceUrl,
    normalizedUrl: resolution.normalizedUrl,
    embedUrl: resolution.embedUrl,
    platform: resolution.platform,
    externalVideoId: resolution.externalVideoId,
    title,
    thumbnailUrl,
    publishedAt,
    editorNote: parsed.editorNote?.trim() || null,
    actorUserId: session.user.id,
  });

  if (!video) {
    throw new Error("Failed to save creator video");
  }

  return { ok: true as const, id: video.id };
}

export async function updateGearCreatorVideoEditorialNote(
  id: string,
  input: unknown,
) {
  const session = await requireEditorSession();
  const parsed = gearCreatorVideoEditorialInput.parse(input);

  const updated = await updateGearCreatorVideoEditorialData({
    id,
    editorNote: parsed.editorNote?.trim() || null,
    actorUserId: session.user.id,
  });

  if (!updated) {
    throw Object.assign(new Error("Creator video not found"), { status: 404 });
  }

  return { ok: true as const };
}

export async function deactivateGearCreatorVideo(id: string) {
  const session = await requireEditorSession();
  const updated = await deactivateGearCreatorVideoData({
    id,
    actorUserId: session.user.id,
  });

  if (!updated) {
    throw Object.assign(new Error("Creator video not found"), { status: 404 });
  }

  return { ok: true as const };
}
