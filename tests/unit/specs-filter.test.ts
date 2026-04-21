import { describe,expect,it } from "vitest";
import type { SpecsTableSection } from "~/app/[locale]/(pages)/gear/_components/specs-table";
import { filterSpecsSections } from "~/lib/specs/filter";

const sections: SpecsTableSection[] = [
  {
    title: "Basic Information",
    data: [
      { label: "Weight", value: "450 g" },
      {
        label: "MSRP At Launch",
        value: "$1,999",
        searchTerms: ["price", "launch price", "retail price", "cost"],
      },
      { label: "Mount", value: "E Mount" },
    ],
  },
  {
    title: "Video",
    data: [
      { label: "Max FPS", value: "120 fps" },
      { label: "Codec", value: "H.265" },
    ],
  },
  {
    title: "Focus",
    data: [
      {
        label: "Focus Points",
        value: "693",
        searchTerms: ["autofocus", "af points", "af"],
      },
    ],
  },
];

describe("filterSpecsSections", () => {
  it("returns the original sections when the query is empty", () => {
    expect(filterSpecsSections(sections, "")).toEqual(sections);
    expect(filterSpecsSections(sections, "   ")).toEqual(sections);
  });

  it("filters by matching row labels", () => {
    expect(filterSpecsSections(sections, "fps")).toEqual([
      {
        title: "Video",
        data: [{ label: "Max FPS", value: "120 fps" }],
      },
    ]);
  });

  it("filters by matching row aliases", () => {
    expect(filterSpecsSections(sections, "price")).toEqual([
      {
        title: "Basic Information",
        data: [
          {
            label: "MSRP At Launch",
            value: "$1,999",
            searchTerms: ["price", "launch price", "retail price", "cost"],
          },
        ],
      },
    ]);
  });

  it("keeps the full section when the section title matches", () => {
    expect(filterSpecsSections(sections, "video")).toEqual([sections[1]!]);
  });

  it("matches case-insensitively and trims whitespace", () => {
    expect(filterSpecsSections(sections, "  MOUNT  ")).toEqual([
      {
        title: "Basic Information",
        data: [{ label: "Mount", value: "E Mount" }],
      },
    ]);
  });

  it("matches non-label synonyms like autofocus", () => {
    expect(filterSpecsSections(sections, "autofocus")).toEqual([
      {
        title: "Focus",
        data: [
          {
            label: "Focus Points",
            value: "693",
            searchTerms: ["autofocus", "af points", "af"],
          },
        ],
      },
    ]);
  });

  it("removes sections with no matching rows", () => {
    expect(filterSpecsSections(sections, "battery")).toEqual([]);
  });
});
