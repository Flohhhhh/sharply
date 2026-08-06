import { beforeEach, describe, expect, it, vi } from "vitest";

import { locales } from "~/i18n/config";
import { localizePathname } from "~/i18n/routing";

const cacheMocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
}));

const serviceMocks = vi.hoisted(() => ({
  assignTagToGear: vi.fn(),
  createTag: vi.fn(),
  deleteTag: vi.fn(),
  removeTagFromGear: vi.fn(),
  updateTag: vi.fn(),
}));

vi.mock("next/cache", () => cacheMocks);
vi.mock("server-only", () => ({}));
vi.mock("~/server/tags/service", () => serviceMocks);

import {
  actionAssignTagToGear,
  actionCreateTag,
  actionDeleteTag,
  actionRemoveTagFromGear,
  actionUpdateTag,
} from "~/server/tags/actions";

function expectLocalizedPaths(
  pathnames: string[],
  totalCalls: number = locales.length * pathnames.length,
) {
  expect(cacheMocks.revalidatePath).toHaveBeenCalledTimes(totalCalls);

  for (const locale of locales) {
    for (const pathname of pathnames) {
      expect(cacheMocks.revalidatePath).toHaveBeenCalledWith(
        localizePathname(pathname, locale),
      );
    }
  }
}

describe("tag actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("revalidates localized tag and admin pages after creating a tag", async () => {
    const tag = { id: "tag-1", slug: "wildlife" };
    serviceMocks.createTag.mockResolvedValue(tag);

    await expect(actionCreateTag({ name: "Wildlife" })).resolves.toBe(tag);

    expectLocalizedPaths(["/admin/tags", "/tags", "/tags/wildlife"]);
  });

  it("revalidates localized tag and admin pages after updating a tag", async () => {
    const tag = { id: "tag-1", slug: "wildlife" };
    serviceMocks.updateTag.mockResolvedValue(tag);

    await expect(
      actionUpdateTag("tag-1", { name: "Wildlife" }),
    ).resolves.toBe(tag);

    expectLocalizedPaths(["/admin/tags", "/tags", "/tags/wildlife"]);
  });

  it("revalidates localized tag routes after deleting a tag", async () => {
    serviceMocks.deleteTag.mockResolvedValue(undefined);

    await actionDeleteTag("tag-1");

    expectLocalizedPaths(["/admin/tags", "/tags"], locales.length * 3);
    for (const locale of locales) {
      expect(cacheMocks.revalidatePath).toHaveBeenCalledWith(
        localizePathname("/tags/[slug]", locale),
        "page",
      );
    }
    expect(cacheMocks.revalidatePath).toHaveBeenCalledTimes(locales.length * 3);
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
    expectLocalizedPaths(["/gear/nikon-zf", "/tags/wildlife", "/admin/tags"]);
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
    expectLocalizedPaths(["/gear/nikon-zf", "/tags/wildlife", "/admin/tags"]);
  });
});
