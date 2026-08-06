import { describe, expect, it } from "vitest";
import { filterTagDictionary } from "~/lib/tags/filter-tag-dictionary";

const tags = [
  {
    name: "Wildlife",
    slug: "wildlife",
    description: "Gear for photographing animals.",
    pageTitle: null,
    pageContent: null,
  },
  {
    name: "Travel friendly",
    slug: "travel-friendly",
    description: null,
    pageTitle: "Travel photography gear",
    pageContent: "Compact gear for every journey.",
  },
];

describe("filterTagDictionary", () => {
  it("matches tag names and public copy without case sensitivity", () => {
    expect(filterTagDictionary(tags, "WILDLIFE")).toEqual([tags[0]]);
    expect(filterTagDictionary(tags, "journey")).toEqual([tags[1]]);
  });

  it("returns every tag for an empty query", () => {
    expect(filterTagDictionary(tags, "  ")).toEqual(tags);
  });
});
