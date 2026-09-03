import { beforeEach, describe, expect, it, vi } from "vitest";
const revalidationMocks = vi.hoisted(() => ({
  revalidateGearPages: vi.fn(),
  revalidateLocalizedPaths: vi.fn(),
}));
const cacheMocks = vi.hoisted(() => ({
  invalidatePublicTagOptionsCache: vi.fn(),
}));

const serviceMocks = vi.hoisted(() => ({
  assignTagToGear: vi.fn(),
  createTag: vi.fn(),
  deleteTag: vi.fn(),
  removeTagFromGear: vi.fn(),
  updateTag: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("~/server/tags/service", () => serviceMocks);
vi.mock("~/server/revalidation", () => revalidationMocks);
vi.mock("~/server/tags/cache", () => cacheMocks);

import {
  actionAssignTagToGear,
  actionCreateTag,
  actionDeleteTag,
  actionRemoveTagFromGear,
  actionUpdateTag,
} from "~/server/tags/actions";

describe("tag actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("revalidates localized tag and admin pages after creating a tag", async () => {
    const tag = { id: "tag-1", slug: "wildlife" };
    serviceMocks.createTag.mockResolvedValue(tag);

    await expect(actionCreateTag({ name: "Wildlife" })).resolves.toBe(tag);

    expect(revalidationMocks.revalidateLocalizedPaths).toHaveBeenCalledWith([
      "/admin/tags",
      "/tags",
      "/tags/wildlife",
    ]);
    expect(cacheMocks.invalidatePublicTagOptionsCache).toHaveBeenCalledOnce();
  });

  it("revalidates localized tag and admin pages after updating a tag", async () => {
    const tag = { id: "tag-1", slug: "wildlife" };
    serviceMocks.updateTag.mockResolvedValue(tag);

    await expect(actionUpdateTag("tag-1", { name: "Wildlife" })).resolves.toBe(
      tag,
    );

    expect(revalidationMocks.revalidateLocalizedPaths).toHaveBeenCalledWith([
      "/admin/tags",
      "/tags",
      "/tags/wildlife",
    ]);
    expect(cacheMocks.invalidatePublicTagOptionsCache).toHaveBeenCalledOnce();
  });

  it("revalidates localized tag routes after deleting a tag", async () => {
    serviceMocks.deleteTag.mockResolvedValue(undefined);

    await actionDeleteTag("tag-1");

    expect(revalidationMocks.revalidateLocalizedPaths).toHaveBeenNthCalledWith(
      1,
      ["/admin/tags", "/tags"],
    );
    expect(cacheMocks.invalidatePublicTagOptionsCache).toHaveBeenCalledOnce();
    expect(revalidationMocks.revalidateLocalizedPaths).toHaveBeenNthCalledWith(
      2,
      ["/tags/[slug]"],
      "page",
    );
  });

  it("revalidates localized gear, tag, and admin pages after assigning a tag", async () => {
    serviceMocks.assignTagToGear.mockResolvedValue({
      slug: "nikon-zf",
      tagSlug: "wildlife",
    });

    await actionAssignTagToGear("gear-1", "tag-1");

    expect(serviceMocks.assignTagToGear).toHaveBeenCalledWith({
      gearId: "gear-1",
      tagId: "tag-1",
    });
    expect(revalidationMocks.revalidateGearPages).toHaveBeenCalledWith([
      "nikon-zf",
    ]);
    expect(revalidationMocks.revalidateLocalizedPaths).toHaveBeenCalledWith([
      "/tags/wildlife",
      "/admin/tags",
    ]);
    expect(cacheMocks.invalidatePublicTagOptionsCache).not.toHaveBeenCalled();
  });

  it("revalidates localized gear, tag, and admin pages after removing a tag", async () => {
    serviceMocks.removeTagFromGear.mockResolvedValue({
      slug: "nikon-zf",
      tagSlug: "wildlife",
    });

    await actionRemoveTagFromGear("gear-1", "tag-1");

    expect(serviceMocks.removeTagFromGear).toHaveBeenCalledWith({
      gearId: "gear-1",
      tagId: "tag-1",
    });
    expect(revalidationMocks.revalidateGearPages).toHaveBeenCalledWith([
      "nikon-zf",
    ]);
    expect(revalidationMocks.revalidateLocalizedPaths).toHaveBeenCalledWith([
      "/tags/wildlife",
      "/admin/tags",
    ]);
    expect(cacheMocks.invalidatePublicTagOptionsCache).not.toHaveBeenCalled();
  });
});
