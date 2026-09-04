import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn().mockReturnValue(true),
  fetchAdminTagsData: vi.fn(),
  fetchTagsByGearIdData: vi.fn(),
  fetchTagsData: vi.fn(),
  assignTagToGearData: vi.fn(),
  removeTagFromGearData: vi.fn(),
  fetchTagByIdData: vi.fn(),
  findGearByIdData: vi.fn(),
  insertTagData: vi.fn(),
  updateTagData: vi.fn(),
  countTagAssignmentsData: vi.fn(),
  deleteTagData: vi.fn(),
  fetchPublicTagOptionsData: vi.fn(),
}));
const cacheState = vi.hoisted(() => ({
  keyParts: undefined as string[] | undefined,
  options: undefined as { revalidate: false; tags: string[] } | undefined,
}));

vi.mock("server-only", () => ({}));
vi.mock("~/server/auth", () => ({
  getSessionOrThrow: vi.fn().mockResolvedValue({ user: { role: "EDITOR" } }),
}));
vi.mock("~/lib/auth/auth-helpers", () => ({
  requireRole: mocks.requireRole,
}));
vi.mock("~/server/gear/listing-table-service", () => ({
  attachGearListingTableFields: vi.fn(),
}));
vi.mock("next/cache", () => ({
  unstable_cache: (
    resolver: () => Promise<unknown>,
    keyParts: string[],
    options: { revalidate: false; tags: string[] },
  ) => {
    cacheState.keyParts = keyParts;
    cacheState.options = options;
    return resolver;
  },
}));
vi.mock("~/server/tags/data", () => ({
  assignTagToGearData: mocks.assignTagToGearData,
  countTagAssignmentsData: mocks.countTagAssignmentsData,
  deleteTagData: mocks.deleteTagData,
  fetchAdminTagsData: mocks.fetchAdminTagsData,
  fetchGearByTagIdData: vi.fn(),
  fetchPublicTagOptionsData: mocks.fetchPublicTagOptionsData,
  fetchTagByIdData: mocks.fetchTagByIdData,
  fetchTagsByGearIdData: mocks.fetchTagsByGearIdData,
  fetchTagsData: mocks.fetchTagsData,
  findGearByIdData: mocks.findGearByIdData,
  insertTagData: mocks.insertTagData,
  removeTagFromGearData: mocks.removeTagFromGearData,
  searchGearForTagAssignmentData: vi.fn(),
  updateTagData: mocks.updateTagData,
}));

import {
  assignTagToGear,
  createTag,
  deleteTag,
  fetchAdminTags,
  fetchGearTagsForEditor,
  fetchPublicTagOptions,
  fetchTagsForEditor,
  removeTagFromGear,
  updateTag,
} from "~/server/tags/service";

describe("tag service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a normalized tag with an optional description", async () => {
    mocks.insertTagData.mockResolvedValue({ id: "tag-1" });

    await createTag({
      name: " Wildlife ",
      slug: "wildlife",
      description: " Wildlife-ready gear ",
    });

    expect(mocks.insertTagData).toHaveBeenCalledWith({
      name: "Wildlife",
      slug: "wildlife",
      description: "Wildlife-ready gear",
      icon: null,
      pageTitle: null,
      pageContent: null,
      internalNotes: null,
      unlisted: false,
    });
    expect(mocks.requireRole).toHaveBeenCalledWith(expect.anything(), [
      "ADMIN",
    ]);
  });

  it("returns the client-safe public tag options", async () => {
    const options = [
      { id: "tag-1", name: "Wildlife", slug: "wildlife", icon: null },
    ];
    mocks.fetchPublicTagOptionsData.mockResolvedValue(options);

    await expect(fetchPublicTagOptions()).resolves.toEqual(options);
    expect(mocks.fetchPublicTagOptionsData).toHaveBeenCalledOnce();
    expect(cacheState).toEqual({
      keyParts: ["public-tag-options"],
      options: {
        revalidate: false,
        tags: ["public-tag-options"],
      },
    });
  });

  it("returns only the editor-safe list and assigned tag rows", async () => {
    const tag = { id: "tag-1", name: "Wildlife", slug: "wildlife" };
    mocks.fetchTagsData.mockResolvedValue([tag]);
    mocks.fetchTagsByGearIdData.mockResolvedValue([tag]);

    await expect(fetchTagsForEditor()).resolves.toEqual([tag]);
    await expect(fetchGearTagsForEditor("gear-1")).resolves.toEqual([tag]);
    expect(mocks.fetchTagsData).toHaveBeenCalledOnce();
    expect(mocks.fetchTagsByGearIdData).toHaveBeenCalledWith("gear-1");
  });

  it("prevents editors from reading the full admin tag list", async () => {
    mocks.requireRole.mockReturnValueOnce(true).mockReturnValueOnce(false);

    await expect(fetchAdminTags()).rejects.toThrow("Unauthorized");
    expect(mocks.fetchAdminTagsData).not.toHaveBeenCalled();
  });

  it("creates editor tags as unlisted without internal notes", async () => {
    mocks.requireRole.mockReturnValueOnce(true).mockReturnValueOnce(false);
    mocks.insertTagData.mockResolvedValue({
      id: "tag-1",
      name: "Wildlife",
      slug: "wildlife",
      description: null,
      icon: null,
      pageTitle: null,
      pageContent: null,
      internalNotes: null,
      unlisted: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const tag = await createTag({
      name: "Wildlife",
      slug: "wildlife",
      internalNotes: "attempted override",
      unlisted: false,
    });

    expect(mocks.insertTagData).toHaveBeenCalledWith(
      expect.objectContaining({ internalNotes: null, unlisted: true }),
    );
    expect(tag).toHaveProperty("internalNotes", null);
    expect(tag).not.toHaveProperty("unlisted");
  });

  it("allows editors to manage tag assignments", async () => {
    mocks.fetchTagByIdData.mockResolvedValue({ id: "tag-1", slug: "wildlife" });
    mocks.findGearByIdData.mockResolvedValue({
      id: "gear-1",
      slug: "nikon-zf",
    });

    await assignTagToGear({ gearId: "gear-1", tagId: "tag-1" });
    await removeTagFromGear({ gearId: "gear-1", tagId: "tag-1" });

    expect(mocks.assignTagToGearData).toHaveBeenCalledWith({
      gearId: "gear-1",
      tagId: "tag-1",
    });
    expect(mocks.removeTagFromGearData).toHaveBeenCalledWith({
      gearId: "gear-1",
      tagId: "tag-1",
    });
  });

  it("rejects tag creation without an editor role", async () => {
    mocks.requireRole.mockReturnValueOnce(false);

    await expect(
      createTag({ name: "Wildlife", slug: "wildlife" }),
    ).rejects.toThrow("Unauthorized");
    expect(mocks.insertTagData).not.toHaveBeenCalled();
  });

  it("persists an explicit unlisted state", async () => {
    mocks.updateTagData.mockResolvedValue({ id: "tag-1" });

    await updateTag("tag-1", {
      name: "Wildlife",
      unlisted: true,
    });

    expect(mocks.updateTagData).toHaveBeenCalledWith(
      expect.objectContaining({ id: "tag-1", unlisted: true }),
    );
  });

  it("keeps updates admin-only", async () => {
    mocks.requireRole.mockReturnValueOnce(true).mockReturnValueOnce(false);

    await expect(updateTag("tag-1", { name: "Wildlife" })).rejects.toThrow(
      "Unauthorized",
    );
    expect(mocks.updateTagData).not.toHaveBeenCalled();
  });

  it("keeps deletion admin-only", async () => {
    mocks.requireRole.mockReturnValueOnce(true).mockReturnValueOnce(false);

    await expect(deleteTag("tag-1")).rejects.toThrow("Unauthorized");
    expect(mocks.countTagAssignmentsData).not.toHaveBeenCalled();
  });

  it("rejects invalid slugs before writing", async () => {
    await expect(
      createTag({ name: "Compact", slug: "Not A Slug" }),
    ).rejects.toThrow("Slug must use lowercase letters, numbers, and hyphens.");
    expect(mocks.insertTagData).not.toHaveBeenCalled();
  });

  it('rejects the reserved "none" slug before writing', async () => {
    await expect(
      createTag({ name: "None", slug: "none" }),
    ).rejects.toMatchObject({
      issues: [
        expect.objectContaining({ message: 'The slug "none" is reserved.' }),
      ],
    });
    expect(mocks.insertTagData).not.toHaveBeenCalled();
  });

  it("blocks deletion while a tag remains assigned", async () => {
    mocks.countTagAssignmentsData.mockResolvedValue(1);

    await expect(deleteTag("tag-1")).rejects.toThrow(
      "Remove this tag from all gear before deleting it.",
    );
    expect(mocks.deleteTagData).not.toHaveBeenCalled();
  });
});
