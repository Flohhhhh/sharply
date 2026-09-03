import { describe, expect, it } from "vitest";
import { normalizeTagSlugs } from "~/lib/tags/normalize-tag-slugs";

const options = [{ slug: "wildlife" }, { slug: "travel" }];

describe("normalizeTagSlugs", () => {
  it("trims, filters, and deduplicates while preserving request order", () => {
    expect(
      normalizeTagSlugs(
        [" wildlife ", "deleted", "travel", "wildlife", "", "private"],
        options,
      ),
    ).toEqual(["wildlife", "travel"]);
  });

  it("returns an empty list when no requested slugs are listed", () => {
    expect(normalizeTagSlugs(["deleted", "private", " "], options)).toEqual([]);
  });
});
