import "server-only";

import { and,asc,eq,sql } from "drizzle-orm";
import { db } from "~/server/db";
import {
  approvedCreators,
  type creatorVideoPlatformEnum,
  gear,
  gearCreatorVideos,
} from "~/server/db/schema";

export type ApprovedCreatorPlatform =
  (typeof creatorVideoPlatformEnum.enumValues)[number];

export type ApprovedCreatorRow = {
  id: string;
  name: string;
  platform: ApprovedCreatorPlatform;
  channelUrl: string;
  avatarUrl: string | null;
  isActive: boolean;
  internalNotes: string | null;
  activeVideoCount: number;
  createdAt: Date;
  updatedAt: Date;
};

type ApprovedCreatorBaseRow = Omit<ApprovedCreatorRow, "activeVideoCount">;

export async function fetchApprovedCreatorsData(): Promise<ApprovedCreatorRow[]> {
  const rows = await db
    .select({
      id: approvedCreators.id,
      name: approvedCreators.name,
      platform: approvedCreators.platform,
      channelUrl: approvedCreators.channelUrl,
      avatarUrl: approvedCreators.avatarUrl,
      isActive: approvedCreators.isActive,
      internalNotes: approvedCreators.internalNotes,
      activeVideoCount: sql<number>`count(${gearCreatorVideos.id}) filter (where ${gearCreatorVideos.isActive})`,
      createdAt: approvedCreators.createdAt,
      updatedAt: approvedCreators.updatedAt,
    })
    .from(approvedCreators)
    .leftJoin(
      gearCreatorVideos,
      eq(gearCreatorVideos.creatorId, approvedCreators.id),
    )
    .groupBy(approvedCreators.id)
    .orderBy(asc(approvedCreators.name));

  return rows.map((row) => ({
    ...row,
    activeVideoCount: Number(row.activeVideoCount ?? 0),
  }));
}

export async function fetchActiveApprovedCreatorsData(
  platform: ApprovedCreatorPlatform,
): Promise<ApprovedCreatorBaseRow[]> {
  return db
    .select({
      id: approvedCreators.id,
      name: approvedCreators.name,
      platform: approvedCreators.platform,
      channelUrl: approvedCreators.channelUrl,
      avatarUrl: approvedCreators.avatarUrl,
      isActive: approvedCreators.isActive,
      internalNotes: approvedCreators.internalNotes,
      createdAt: approvedCreators.createdAt,
      updatedAt: approvedCreators.updatedAt,
    })
    .from(approvedCreators)
    .where(
      and(
        eq(approvedCreators.platform, platform),
        eq(approvedCreators.isActive, true),
      ),
    )
    .orderBy(asc(approvedCreators.name));
}

export async function fetchApprovedCreatorByIdData(id: string) {
  const rows = await db
    .select({
      id: approvedCreators.id,
      name: approvedCreators.name,
      platform: approvedCreators.platform,
      channelUrl: approvedCreators.channelUrl,
      avatarUrl: approvedCreators.avatarUrl,
      isActive: approvedCreators.isActive,
      internalNotes: approvedCreators.internalNotes,
      createdAt: approvedCreators.createdAt,
      updatedAt: approvedCreators.updatedAt,
    })
    .from(approvedCreators)
    .where(eq(approvedCreators.id, id))
    .limit(1);

  return rows[0] ?? null;
}

export async function insertApprovedCreatorData(params: {
  name: string;
  platform: ApprovedCreatorPlatform;
  channelUrl: string;
  avatarUrl?: string | null;
  internalNotes?: string | null;
  isActive: boolean;
}) {
  const rows = await db
    .insert(approvedCreators)
    .values({
      name: params.name,
      platform: params.platform,
      channelUrl: params.channelUrl,
      avatarUrl: params.avatarUrl ?? null,
      internalNotes: params.internalNotes ?? null,
      isActive: params.isActive,
    })
    .returning();

  return rows[0] ?? null;
}

export async function updateApprovedCreatorData(params: {
  id: string;
  name: string;
  platform: ApprovedCreatorPlatform;
  channelUrl: string;
  avatarUrl?: string | null;
  internalNotes?: string | null;
  isActive: boolean;
}) {
  const rows = await db
    .update(approvedCreators)
    .set({
      name: params.name,
      platform: params.platform,
      channelUrl: params.channelUrl,
      avatarUrl: params.avatarUrl ?? null,
      internalNotes: params.internalNotes ?? null,
      isActive: params.isActive,
      updatedAt: new Date(),
    })
    .where(eq(approvedCreators.id, params.id))
    .returning();

  return rows[0] ?? null;
}

export async function setApprovedCreatorActiveData(params: {
  id: string;
  isActive: boolean;
}) {
  const rows = await db
    .update(approvedCreators)
    .set({
      isActive: params.isActive,
      updatedAt: new Date(),
    })
    .where(eq(approvedCreators.id, params.id))
    .returning({
      id: approvedCreators.id,
      isActive: approvedCreators.isActive,
    });

  return rows[0] ?? null;
}

export async function fetchGearSlugsByCreatorIdData(creatorId: string) {
  return db
    .selectDistinct({
      slug: gear.slug,
    })
    .from(gearCreatorVideos)
    .innerJoin(gear, eq(gear.id, gearCreatorVideos.gearId))
    .where(eq(gearCreatorVideos.creatorId, creatorId));
}
