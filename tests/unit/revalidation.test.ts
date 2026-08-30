import { beforeEach, describe, expect, it, vi } from "vitest";
import { locales } from "~/i18n/config";
import { localizePathname } from "~/i18n/routing";

const cacheMocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => cacheMocks);

import {
  revalidateBrowsePages,
  revalidateGearPages,
  revalidateLocalizedPaths,
} from "~/server/revalidation";

describe("shared public revalidation helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("revalidates localized page paths", () => {
    revalidateLocalizedPaths(["/gear/nikon-zf"], "page");

    expect(cacheMocks.revalidatePath).toHaveBeenCalledTimes(locales.length);
    for (const locale of locales) {
      expect(cacheMocks.revalidatePath).toHaveBeenCalledWith(
        localizePathname("/gear/nikon-zf", locale),
        "page",
      );
    }
  });

  it("deduplicates slugs and ignores blank values", () => {
    revalidateGearPages(["nikon-zf", " nikon-zf ", ""]);

    expect(cacheMocks.revalidatePath).toHaveBeenCalledTimes(locales.length);
    expect(cacheMocks.revalidatePath).toHaveBeenCalledWith(
      "/ja/gear/nikon-zf",
      "page",
    );
  });

  it("revalidates the browse layout for every locale", () => {
    revalidateBrowsePages();

    expect(cacheMocks.revalidatePath).toHaveBeenCalledTimes(locales.length);
    for (const locale of locales) {
      expect(cacheMocks.revalidatePath).toHaveBeenCalledWith(
        localizePathname("/browse", locale),
        "layout",
      );
    }
  });

  it("revalidates gear pages and browse when requested", () => {
    revalidateGearPages(["canon-r5", "canon-r5-ii"], {
      includeBrowse: true,
    });

    expect(cacheMocks.revalidatePath).toHaveBeenCalledTimes(locales.length * 3);
    expect(cacheMocks.revalidatePath).toHaveBeenCalledWith(
      "/gear/canon-r5",
      "page",
    );
    expect(cacheMocks.revalidatePath).toHaveBeenCalledWith(
      "/ja/gear/canon-r5-ii",
      "page",
    );
    expect(cacheMocks.revalidatePath).toHaveBeenCalledWith(
      "/de/browse",
      "layout",
    );
  });
});
