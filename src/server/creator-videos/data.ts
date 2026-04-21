import "server-only";

import { and,desc,eq,sql } from "drizzle-orm";
import { db } from "~/server/db";
import {
  approvedCreators,
  gearCreatorVideos,
} from "~/server/db/schema";

export type PublicGearCreatorVideoRow = {
  id: string;
  sourceUrl: string;
  normalizedUrl: string;
  embedUrl: string;
  platform: "YOUTUBE";
  externalVideoId: string;
  title: string;
  thumbnailUrl: string | null;
  publishedAt: Date | null;
  editorNote: string | null;
  createdAt: Date;
  creator: {
    id: string;
    name: string;
    channelUrl: string;
    avatarUrl: string | null;
  };
};

export type ManageGearCreatorVideoRow = PublicGearCreatorVideoRow & {
  creator: PublicGearCreatorVideoRow["creator"] & {
    isActive: boolean;
  };
};

export async function fetchPublicGearCreatorVideosByGearIdData(
  gearId: string,
): Promise<PublicGearCreatorVideoRow[]> {
  const rows = await db
    .select({
      id: gearCreatorVideos.id,
      sourceUrl: gearCreatorVideos.sourceUrl,
      normalizedUrl: gearCreatorVideos.normalizedUrl,
      embedUrl: gearCreatorVideos.embedUrl,
      platform: gearCreatorVideos.platform,
      externalVideoId: gearCreatorVideos.externalVideoId,
      title: gearCreatorVideos.title,
      thumbnailUrl: gearCreatorVideos.thumbnailUrl,
      publishedAt: gearCreatorVideos.publishedAt,
      editorNote: gearCreatorVideos.editorNote,
      createdAt: gearCreatorVideos.createdAt,
      creatorId: approvedCreators.id,
      creatorName: approvedCreators.name,
      creatorChannelUrl: approvedCreators.channelUrl,
      creatorAvatarUrl: approvedCreators.avatarUrl,
    })
    .from(gearCreatorVideos)
    .innerJoin(approvedCreators, eq(approvedCreators.id, gearCreatorVideos.creatorId))
    .where(
      and(
        eq(gearCreatorVideos.gearId, gearId),
        eq(gearCreatorVideos.isActive, true),
        eq(approvedCreators.isActive, true),
      ),
    )
    .orderBy(
      sql`${gearCreatorVideos.publishedAt} desc nulls last`,
      desc(gearCreatorVideos.createdAt),
    );

  return rows.map((row) => ({
    id: row.id,
    sourceUrl: row.sourceUrl,
    normalizedUrl: row.normalizedUrl,
    embedUrl: row.embedUrl,
    platform: row.platform,
    externalVideoId: row.externalVideoId,
    title: row.title,
    thumbnailUrl: row.thumbnailUrl,
    publishedAt: row.publishedAt,
    editorNote: row.editorNote,
    createdAt: row.createdAt,
    creator: {
      id: row.creatorId,
      name: row.creatorName,
      channelUrl: row.creatorChannelUrl,
      avatarUrl: row.creatorAvatarUrl,
    },
  }));
}

export async function fetchManageGearCreatorVideosByGearIdData(
  gearId: string,
): Promise<ManageGearCreatorVideoRow[]> {
  const rows = await db
    .select({
      id: gearCreatorVideos.id,
      sourceUrl: gearCreatorVideos.sourceUrl,
      normalizedUrl: gearCreatorVideos.normalizedUrl,
      embedUrl: gearCreatorVideos.embedUrl,
      platform: gearCreatorVideos.platform,
      externalVideoId: gearCreatorVideos.externalVideoId,
      title: gearCreatorVideos.title,
      thumbnailUrl: gearCreatorVideos.thumbnailUrl,
      publishedAt: gearCreatorVideos.publishedAt,
      editorNote: gearCreatorVideos.editorNote,
      createdAt: gearCreatorVideos.createdAt,
      creatorId: approvedCreators.id,
      creatorName: approvedCreators.name,
      creatorChannelUrl: approvedCreators.channelUrl,
      creatorAvatarUrl: approvedCreators.avatarUrl,
      creatorIsActive: approvedCreators.isActive,
    })
    .from(gearCreatorVideos)
    .innerJoin(approvedCreators, eq(approvedCreators.id, gearCreatorVideos.creatorId))
    .where(
      and(
        eq(gearCreatorVideos.gearId, gearId),
        eq(gearCreatorVideos.isActive, true),
      ),
    )
    .orderBy(
      sql`${gearCreatorVideos.publishedAt} desc nulls last`,
      desc(gearCreatorVideos.createdAt),
    );

  return rows.map((row) => ({
    id: row.id,
    sourceUrl: row.sourceUrl,
    normalizedUrl: row.normalizedUrl,
    embedUrl: row.embedUrl,
    platform: row.platform,
    externalVideoId: row.externalVideoId,
    title: row.title,
    thumbnailUrl: row.thumbnailUrl,
    publishedAt: row.publishedAt,
    editorNote: row.editorNote,
    createdAt: row.createdAt,
    creator: {
      id: row.creatorId,
      name: row.creatorName,
      channelUrl: row.creatorChannelUrl,
      avatarUrl: row.creatorAvatarUrl,
      isActive: row.creatorIsActive,
    },
  }));
}

export async function upsertGearCreatorVideoData(params: {
  gearId: string;
  creatorId: string;
  sourceUrl: string;
  normalizedUrl: string;
  embedUrl: string;
  platform: "YOUTUBE";
  externalVideoId: string;
  title: string;
  thumbnailUrl?: string | null;
  publishedAt?: Date | null;
  editorNote?: string | null;
  actorUserId: string;
}) {
  const rows = await db
    .insert(gearCreatorVideos)
    .values({
      gearId: params.gearId,
      creatorId: params.creatorId,
      sourceUrl: params.sourceUrl,
      normalizedUrl: params.normalizedUrl,
      embedUrl: params.embedUrl,
      platform: params.platform,
      externalVideoId: params.externalVideoId,
      title: params.title,
      thumbnailUrl: params.thumbnailUrl ?? null,
      publishedAt: params.publishedAt ?? null,
      editorNote: params.editorNote ?? null,
      isActive: true,
      createdByUserId: params.actorUserId,
      updatedByUserId: params.actorUserId,
    })
    .onConflictDoUpdate({
      target: [
        gearCreatorVideos.gearId,
        gearCreatorVideos.platform,
        gearCreatorVideos.externalVideoId,
      ],
      set: {
        creatorId: params.creatorId,
        sourceUrl: params.sourceUrl,
        normalizedUrl: params.normalizedUrl,
        embedUrl: params.embedUrl,
        title: params.title,
        thumbnailUrl: params.thumbnailUrl ?? null,
        publishedAt: params.publishedAt ?? null,
        editorNote: params.editorNote ?? null,
        isActive: true,
        updatedByUserId: params.actorUserId,
        updatedAt: new Date(),
      },
    })
    .returning({
      id: gearCreatorVideos.id,
    });

  return rows[0] ?? null;
}

export async function updateGearCreatorVideoEditorialData(params: {
  id: string;
  editorNote: string | null;
  actorUserId: string;
}) {
  const rows = await db
    .update(gearCreatorVideos)
    .set({
      editorNote: params.editorNote,
      updatedByUserId: params.actorUserId,
      updatedAt: new Date(),
    })
    .where(eq(gearCreatorVideos.id, params.id))
    .returning({
      id: gearCreatorVideos.id,
    });

  return rows[0] ?? null;
}

export async function deactivateGearCreatorVideoData(params: {
  id: string;
  actorUserId: string;
}) {
  const rows = await db
    .update(gearCreatorVideos)
    .set({
      isActive: false,
      updatedByUserId: params.actorUserId,
      updatedAt: new Date(),
    })
    .where(eq(gearCreatorVideos.id, params.id))
    .returning({
      id: gearCreatorVideos.id,
    });

  return rows[0] ?? null;
}
