import { describe,expect,it } from "vitest";
import { buildCompareSections } from "~/components/compare/compare-specs-table.helpers";
import type { SpecsTableSection } from "~/app/[locale]/(pages)/gear/_components/specs-table";

describe("buildCompareSections", () => {
  it("orders sections by registry id rather than translated titles", () => {
    const aSections: SpecsTableSection[] = [
      {
        id: "lens-focus",
        title: "Fokus",
        data: [
          {
            key: "hasAutofocus",
            label: "Autofokus",
            value: "Ja",
          },
        ],
      },
    ];
    const bSections: SpecsTableSection[] = [
      {
        id: "core",
        title: "Basisinformationen",
        data: [
          {
            key: "mounts",
            label: "Anschluss",
            value: "E Mount",
          },
        ],
      },
    ];

    expect(buildCompareSections(aSections, bSections).map((section) => section.id))
      .toEqual(["core", "lens-focus"]);
  });

  it("orders rows by registry field key and keeps repeated keys scoped to their section", () => {
    const aSections: SpecsTableSection[] = [
      {
        id: "lens-focus",
        title: "Focus",
        data: [
          {
            key: "frontElementRotates",
            label: "Front Element Rotates",
            value: "Yes",
          },
          {
            key: "hasAutofocus",
            label: "Has Autofocus",
            value: "Yes",
          },
        ],
      },
      {
        id: "fixed-lens",
        title: "Integrated Lens",
        data: [
          {
            key: "focalLength",
            label: "Focal Length",
            value: "24-70mm",
          },
        ],
      },
    ];
    const bSections: SpecsTableSection[] = [
      {
        id: "lens-optics",
        title: "Optics",
        data: [
          {
            key: "focalLength",
            label: "Focal Length",
            value: "70-200mm",
          },
        ],
      },
      {
        id: "lens-focus",
        title: "Focus",
        data: [
          {
            key: "hasAutofocus",
            label: "Has Autofocus",
            value: "No",
          },
          {
            key: "frontElementRotates",
            label: "Front Element Rotates",
            value: "No",
          },
        ],
      },
    ];

    const sections = buildCompareSections(aSections, bSections);

    expect(
      sections.find((section) => section.id === "lens-focus")?.rows.map(
        (row) => row.key,
      ),
    ).toEqual(["hasAutofocus", "frontElementRotates"]);
    expect(
      sections
        .filter((section) =>
          ["fixed-lens", "lens-optics"].includes(section.id),
        )
        .map((section) => ({
          id: section.id,
          rowKeys: section.rows.map((row) => row.key),
        })),
    ).toEqual([
      { id: "fixed-lens", rowKeys: ["focalLength"] },
      { id: "lens-optics", rowKeys: ["focalLength"] },
    ]);
  });
});
