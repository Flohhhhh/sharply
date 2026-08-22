import "server-only";

import { and, asc, count, eq, ilike, or } from "drizzle-orm";
import { db } from "~/server/db";
import { brands, gear, gearTags, tags } from "~/server/db/schema";
import { getGearDisplayImageSql } from "~/server/gear/display-image";

export type TagRow = typeof tags.$inferSelect;
export type EditorTagRow = Omit<TagRow, "unlisted">;

export type AdminTagRow = TagRow & {
  assignedGearCount: number;
};

export type TagGearRow = {
  id: string;
  slug: string;
  name: string;
  brandName: string | null;
  gearType?: string;
  releaseDate?: Date | null;
  releaseDatePrecision?: "DAY" | "MONTH" | "YEAR" | null;
  announcedDate?: Date | null;
  announceDatePrecision?: "DAY" | "MONTH" | "YEAR" | null;
  msrpNowUsdCents?: number | null;
  mpbMaxPriceUsdCents?: number | null;
  thumbnailUrl?: string | null;
};
export type PublicTagRow = Pick<
  TagRow,
  "id" | "name" | "slug" | "description" | "icon" | "pageTitle" | "pageContent"
>;

const editorTagSelection = {
  id: tags.id,
  name: tags.name,
  slug: tags.slug,
  description: tags.description,
  icon: tags.icon,
  pageTitle: tags.pageTitle,
  pageContent: tags.pageContent,
  internalNotes: tags.internalNotes,
  createdAt: tags.createdAt,
  updatedAt: tags.updatedAt,
};

export async function fetchTagsData(): Promise<EditorTagRow[]> {
  return db.select(editorTagSelection).from(tags).orderBy(asc(tags.name));
}

export async function fetchAdminTagsData(): Promise<AdminTagRow[]> {
  const rows = await db
    .select({
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
      description: tags.description,
      icon: tags.icon,
      pageTitle: tags.pageTitle,
      pageContent: tags.pageContent,
      internalNotes: tags.internalNotes,
      unlisted: tags.unlisted,
      createdAt: tags.createdAt,
      updatedAt: tags.updatedAt,
      assignedGearCount: count(gearTags.gearId),
    })
    .from(tags)
    .leftJoin(gearTags, eq(gearTags.tagId, tags.id))
    .groupBy(tags.id)
    .orderBy(asc(tags.name));

  return rows.map((row) => ({
    ...row,
    assignedGearCount: Number(row.assignedGearCount),
  }));
}

export async function fetchTagByIdData(id: string): Promise<TagRow | null> {
  const rows = await db.select().from(tags).where(eq(tags.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function insertTagData(input: {
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  pageTitle: string | null;
  pageContent: string | null;
  internalNotes: string | null;
  unlisted: boolean;
}): Promise<TagRow> {
  const rows = await db.insert(tags).values(input).returning();
  if (!rows[0]) throw new Error("Failed to create tag");
  return rows[0];
}

export async function updateTagData(input: {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  pageTitle: string | null;
  pageContent: string | null;
  internalNotes: string | null;
  unlisted?: boolean;
}): Promise<TagRow | null> {
  const rows = await db
    .update(tags)
    .set({
      name: input.name,
      description: input.description,
      icon: input.icon,
      pageTitle: input.pageTitle,
      pageContent: input.pageContent,
      internalNotes: input.internalNotes,
      unlisted: input.unlisted,
      updatedAt: new Date(),
    })
    .where(eq(tags.id, input.id))
    .returning();
  return rows[0] ?? null;
}

export async function fetchPublicTagsData(): Promise<PublicTagRow[]> {
  return db
    .select({
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
      description: tags.description,
      icon: tags.icon,
      pageTitle: tags.pageTitle,
      pageContent: tags.pageContent,
    })
    .from(tags)
    .where(eq(tags.unlisted, false))
    .orderBy(asc(tags.name));
}
export async function fetchPublicTagBySlugData(
  slug: string,
): Promise<PublicTagRow | null> {
  const rows = await db
    .select({
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
      description: tags.description,
      icon: tags.icon,
      pageTitle: tags.pageTitle,
      pageContent: tags.pageContent,
    })
    .from(tags)
    .where(and(eq(tags.slug, slug), eq(tags.unlisted, false)))
    .limit(1);
  return rows[0] ?? null;
}
export async function fetchPublishedGearByTagIdData(
  tagId: string,
): Promise<TagGearRow[]> {
  return db
    .select({
      id: gear.id,
      slug: gear.slug,
      name: gear.name,
      brandName: brands.name,
      gearType: gear.gearType,
      releaseDate: gear.releaseDate,
      releaseDatePrecision: gear.releaseDatePrecision,
      announcedDate: gear.announcedDate,
      announceDatePrecision: gear.announceDatePrecision,
      msrpNowUsdCents: gear.msrpNowUsdCents,
      mpbMaxPriceUsdCents: gear.mpbMaxPriceUsdCents,
      thumbnailUrl: getGearDisplayImageSql(),
    })
    .from(gearTags)
    .innerJoin(gear, eq(gearTags.gearId, gear.id))
    .leftJoin(brands, eq(gear.brandId, brands.id))
    .where(
      and(eq(gearTags.tagId, tagId), eq(gear.publicationState, "PUBLISHED")),
    )
    .orderBy(asc(gear.name));
}

export async function deleteTagData(id: string): Promise<boolean> {
  const rows = await db
    .delete(tags)
    .where(eq(tags.id, id))
    .returning({ id: tags.id });
  return rows.length > 0;
}

export async function countTagAssignmentsData(tagId: string): Promise<number> {
  const rows = await db
    .select({ value: count() })
    .from(gearTags)
    .where(eq(gearTags.tagId, tagId));
  return Number(rows[0]?.value ?? 0);
}

export async function assignTagToGearData(params: {
  gearId: string;
  tagId: string;
}): Promise<void> {
  await db.insert(gearTags).values(params).onConflictDoNothing();
}

export async function removeTagFromGearData(params: {
  gearId: string;
  tagId: string;
}): Promise<void> {
  await db
    .delete(gearTags)
    .where(
      and(eq(gearTags.gearId, params.gearId), eq(gearTags.tagId, params.tagId)),
    );
}

export async function fetchTagsByGearIdData(
  gearId: string,
): Promise<EditorTagRow[]> {
  return db
    .select(editorTagSelection)
    .from(gearTags)
    .innerJoin(tags, eq(gearTags.tagId, tags.id))
    .where(eq(gearTags.gearId, gearId))
    .orderBy(asc(tags.name));
}

export async function fetchGearByTagIdData(
  tagId: string,
): Promise<TagGearRow[]> {
  return db
    .select({
      id: gear.id,
      slug: gear.slug,
      name: gear.name,
      brandName: brands.name,
    })
    .from(gearTags)
    .innerJoin(gear, eq(gearTags.gearId, gear.id))
    .leftJoin(brands, eq(gear.brandId, brands.id))
    .where(eq(gearTags.tagId, tagId))
    .orderBy(asc(gear.name));
}

export async function searchGearForTagAssignmentData(
  query: string,
  limit = 20,
): Promise<TagGearRow[]> {
  const trimmed = query.trim();
  const where = trimmed
    ? or(
        ilike(gear.name, `%${trimmed}%`),
        ilike(gear.slug, `%${trimmed}%`),
        ilike(brands.name, `%${trimmed}%`),
      )
    : undefined;

  return db
    .select({
      id: gear.id,
      slug: gear.slug,
      name: gear.name,
      brandName: brands.name,
    })
    .from(gear)
    .leftJoin(brands, eq(gear.brandId, brands.id))
    .where(where)
    .orderBy(asc(gear.name))
    .limit(limit);
}

export async function findGearByIdData(
  gearId: string,
): Promise<{ id: string; slug: string } | null> {
  const rows = await db
    .select({ id: gear.id, slug: gear.slug })
    .from(gear)
    .where(eq(gear.id, gearId))
    .limit(1);
  return rows[0] ?? null;
}
