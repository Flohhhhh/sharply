import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn().mockReturnValue(true),
  insertTagData: vi.fn(),
  updateTagData: vi.fn(),
  countTagAssignmentsData: vi.fn(),
  deleteTagData: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("~/server/auth", () => ({
  getSessionOrThrow: vi.fn().mockResolvedValue({ user: { role: "EDITOR" } }),
}));
vi.mock("~/lib/auth/auth-helpers", () => ({
  requireRole: mocks.requireRole,
}));
vi.mock("~/server/tags/data", () => ({
  assignTagToGearData: vi.fn(),
  countTagAssignmentsData: mocks.countTagAssignmentsData,
  deleteTagData: mocks.deleteTagData,
  fetchAdminTagsData: vi.fn(),
  fetchGearByTagIdData: vi.fn(),
  fetchTagByIdData: vi.fn(),
  fetchTagsByGearIdData: vi.fn(),
  fetchTagsData: vi.fn(),
  findGearByIdData: vi.fn(),
  insertTagData: mocks.insertTagData,
  removeTagFromGearData: vi.fn(),
  searchGearForTagAssignmentData: vi.fn(),
  updateTagData: mocks.updateTagData,
}));

import { createTag, deleteTag, updateTag } from "~/server/tags/service";

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

  it("rejects tag mutations without an admin role", async () => {
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

  it("rejects invalid slugs before writing", async () => {
    await expect(
      createTag({ name: "Compact", slug: "Not A Slug" }),
    ).rejects.toThrow("Slug must use lowercase letters, numbers, and hyphens.");
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
