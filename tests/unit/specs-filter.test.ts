import { describe,expect,it } from "vitest";
import type { SpecsTableSection } from "~/app/[locale]/(pages)/gear/_components/specs-table";
import { filterSpecsSections } from "~/lib/specs/filter";

const sections: SpecsTableSection[] = [
  {
    id: "core",
    title: "Basic Information",
    searchTerms: ["Basic Information"],
    data: [
      { key: "weightGrams", label: "Weight", value: "450 g" },
      {
        key: "msrpAtLaunchUsdCents",
        label: "MSRP At Launch",
        value: "$1,999",
        searchTerms: ["price", "launch price", "retail price", "cost"],
      },
      { key: "mounts", label: "Mount", value: "E Mount" },
    ],
  },
  {
    id: "camera-video",
    title: "Video",
    searchTerms: ["Video"],
    data: [
      { key: "maxFps", label: "Max FPS", value: "120 fps" },
      { key: "codec", label: "Codec", value: "H.265" },
    ],
  },
  {
    id: "camera-focus",
    title: "Focus",
    searchTerms: ["Focus"],
    data: [
      {
        key: "focusPoints",
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
        id: "camera-video",
        title: "Video",
        searchTerms: ["Video"],
        data: [{ key: "maxFps", label: "Max FPS", value: "120 fps" }],
      },
    ]);
  });

  it("filters by matching row aliases", () => {
    expect(filterSpecsSections(sections, "price")).toEqual([
      {
        id: "core",
        title: "Basic Information",
        searchTerms: ["Basic Information"],
        data: [
          {
            key: "msrpAtLaunchUsdCents",
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
        id: "core",
        title: "Basic Information",
        searchTerms: ["Basic Information"],
        data: [{ key: "mounts", label: "Mount", value: "E Mount" }],
      },
    ]);
  });

  it("matches non-label synonyms like autofocus", () => {
    expect(filterSpecsSections(sections, "autofocus")).toEqual([
      {
        id: "camera-focus",
        title: "Focus",
        searchTerms: ["Focus"],
        data: [
          {
            key: "focusPoints",
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

  it("matches English aliases against localized labels and titles", () => {
    const localizedSections: SpecsTableSection[] = [
      {
        id: "core",
        title: "Basisinformationen",
        searchTerms: ["Basic Information"],
        data: [
          {
            key: "mounts",
            label: "Anschluss",
            value: "E Mount",
            searchTerms: ["lens mount", "camera mount", "Mount"],
          },
        ],
      },
    ];

    expect(filterSpecsSections(localizedSections, "basic")).toEqual(
      localizedSections,
    );
    expect(filterSpecsSections(localizedSections, "mount")).toEqual(
      localizedSections,
    );
  });
});
