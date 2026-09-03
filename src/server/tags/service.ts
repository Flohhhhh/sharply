import "server-only";

import { cache } from "react";
import { z } from "zod";
import { requireRole } from "~/lib/auth/auth-helpers";
import { getSessionOrThrow } from "~/server/auth";
import { attachGearListingTableFields } from "~/server/gear/listing-table-service";
import {
  assignTagToGearData,
  countTagAssignmentsData,
  deleteTagData,
  fetchAdminTagsData,
  fetchGearByTagIdData,
  fetchPublicTagBySlugData,
  fetchPublicTagsData,
  fetchPublishedGearByTagIdData,
  fetchTagByIdData,
  fetchTagSitemapEntriesData,
  fetchTagsByGearIdData,
  fetchTagsData,
  findGearByIdData,
  insertTagData,
  removeTagFromGearData,
  searchGearForTagAssignmentData,
  updateTagData,
} from "./data";
import type { EditorTagRow, TagRow } from "./data";

export type {
  AdminTagRow,
  EditorTagRow,
  TagGearRow,
  TagRow,
  PublicTagRow,
} from "./data";

const createTagSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z
    .string()
    .trim()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must use lowercase letters, numbers, and hyphens.",
    )
    .max(140),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  icon: z.string().trim().max(100).optional().or(z.literal("")),
  pageTitle: z.string().trim().max(240).optional().or(z.literal("")),
  pageContent: z.string().trim().max(20000).optional().or(z.literal("")),
  internalNotes: z.string().trim().max(10000).optional().or(z.literal("")),
  unlisted: z.boolean().default(false),
});
const updateTagSchema = createTagSchema
  .omit({ slug: true, unlisted: true })
  .extend({ unlisted: z.boolean().optional() });
const editorCreateTagSchema = createTagSchema.omit({
  internalNotes: true,
  unlisted: true,
});

async function requireTagViewer() {
  const session = await getSessionOrThrow();
  if (!requireRole(session.user, ["EDITOR"])) {
    throw Object.assign(new Error("Unauthorized"), { status: 403 });
  }
  return session;
}

async function requireTagAdmin() {
  const session = await requireTagViewer();
  if (!requireRole(session.user, ["ADMIN"])) {
    throw Object.assign(new Error("Unauthorized"), { status: 403 });
  }
}

function nullable(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function editorTagRow(tag: TagRow): EditorTagRow {
  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    description: tag.description,
    icon: tag.icon,
    pageTitle: tag.pageTitle,
    pageContent: tag.pageContent,
    internalNotes: tag.internalNotes,
    createdAt: tag.createdAt,
    updatedAt: tag.updatedAt,
  };
}

export async function fetchTagsForEditor() {
  await requireTagViewer();
  return fetchTagsData();
}

export async function fetchAdminTags() {
  await requireTagAdmin();
  return fetchAdminTagsData();
}

export async function fetchGearTagsForEditor(gearId: string) {
  await requireTagViewer();
  return fetchTagsByGearIdData(gearId);
}

export async function fetchTagAssignedGearForEditor(tagId: string) {
  await requireTagViewer();
  return fetchGearByTagIdData(tagId);
}

export async function searchGearForTagAssignment(query: string) {
  await requireTagAdmin();
  return searchGearForTagAssignmentData(query);
}

export async function createTag(input: unknown) {
  const session = await requireTagViewer();
  if (requireRole(session.user, ["ADMIN"])) {
    const parsed = createTagSchema.parse(input);
    return insertTagData({
      ...parsed,
      description: nullable(parsed.description),
      icon: nullable(parsed.icon),
      pageTitle: nullable(parsed.pageTitle),
      pageContent: nullable(parsed.pageContent),
      internalNotes: nullable(parsed.internalNotes),
      unlisted: parsed.unlisted,
    });
  }

  const parsed = editorCreateTagSchema.parse(input);
  return editorTagRow(
    await insertTagData({
      ...parsed,
      description: nullable(parsed.description),
      icon: nullable(parsed.icon),
      pageTitle: nullable(parsed.pageTitle),
      pageContent: nullable(parsed.pageContent),
      internalNotes: null,
      unlisted: true,
    }),
  );
}

export async function updateTag(id: string, input: unknown) {
  await requireTagAdmin();
  const parsed = updateTagSchema.parse(input);
  const updated = await updateTagData({
    id,
    ...parsed,
    description: nullable(parsed.description),
    icon: nullable(parsed.icon),
    pageTitle: nullable(parsed.pageTitle),
    pageContent: nullable(parsed.pageContent),
    internalNotes: nullable(parsed.internalNotes),
    unlisted: parsed.unlisted,
  });
  if (!updated)
    throw Object.assign(new Error("Tag not found"), { status: 404 });
  return updated;
}

export async function deleteTag(id: string) {
  await requireTagAdmin();
  const assignments = await countTagAssignmentsData(id);
  if (assignments > 0) {
    throw Object.assign(
      new Error("Remove this tag from all gear before deleting it."),
      { status: 409 },
    );
  }
  const deleted = await deleteTagData(id);
  if (!deleted)
    throw Object.assign(new Error("Tag not found"), { status: 404 });
}

export async function fetchPublicTagDictionary() {
  return fetchPublicTagsData();
}

export async function fetchTagSitemapEntries() {
  return fetchTagSitemapEntriesData();
}

export const fetchPublicTagBySlug = cache(async (slug: string) =>
  fetchPublicTagBySlugData(slug),
);

export async function fetchPublicTagPage(slug: string) {
  const tag = await fetchPublicTagBySlug(slug);
  if (!tag) return null;
  return {
    ...tag,
    resolvedPageTitle: tag.pageTitle ?? tag.name,
    gear: await attachGearListingTableFields(
      await fetchPublishedGearByTagIdData(tag.id),
    ),
  };
}

export async function assignTagToGear(params: {
  gearId: string;
  tagId: string;
}) {
  await requireTagViewer();
  const [tag, gear] = await Promise.all([
    fetchTagByIdData(params.tagId),
    findGearByIdData(params.gearId),
  ]);
  if (!tag || !gear)
    throw Object.assign(new Error("Gear or tag not found"), { status: 404 });
  await assignTagToGearData(params);
  return { slug: gear.slug, tagSlug: tag.slug };
}

export async function removeTagFromGear(params: {
  gearId: string;
  tagId: string;
}) {
  await requireTagViewer();
  const [tag, gear] = await Promise.all([
    fetchTagByIdData(params.tagId),
    findGearByIdData(params.gearId),
  ]);
  if (!tag || !gear)
    throw Object.assign(new Error("Gear or tag not found"), { status: 404 });
  await removeTagFromGearData(params);
  return { slug: gear.slug, tagSlug: tag.slug };
}
