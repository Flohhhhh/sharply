import { describe, expect, it } from "vitest";
import {
  BULK_IMPORT_FIELD_GUIDE,
  buildBulkImportAiFixPrompt,
  buildBulkImportValidationReport,
  inferBrandFromName,
  parseApertureFromName,
  parseFocalLengthFromName,
  parseGearBulkImportCsv,
  resolveMountValues,
} from "~/lib/admin/gear-bulk-import";
import { MOUNTS } from "~/lib/constants";

describe("gear bulk import utilities", () => {
  it("infers the longest matching brand prefix from the item name", () => {
    const brand = inferBrandFromName("Nikon Nikkor Z 60mm f/2.8");

    expect(brand).toMatchObject({ name: "Nikon" });
  });

  it("resolves mount.value identifiers and rejects unknown mounts", () => {
    const knownMount = MOUNTS.find((mount) => mount.value === "z-nikon");
    expect(knownMount).toBeTruthy();

    const result = resolveMountValues(["z-nikon", "not-a-mount"]);

    expect(result.mountIds).toEqual([knownMount!.id]);
    expect(result.mountValues).toEqual(["z-nikon"]);
    expect(result.errors[0]).toContain("Unknown mount value");
  });

  it.each([
    ["Nikon Nikkor Z 60mm f/2.8", { min: 60, max: 60, isPrime: true }],
    ["Nikon Nikkor Z 24-70mm f/2.8", { min: 24, max: 70, isPrime: false }],
    ["Canon EF 8-15mm f/4L Fisheye USM", { min: 8, max: 15, isPrime: false }],
  ])("parses focal length from %s", (name, expected) => {
    expect(parseFocalLengthFromName(name)).toEqual(expected);
  });

  it.each([
    // f-stop forms
    ["Nikon Nikkor Z 60mm f/2.8", { wide: 2.8 }],
    ["Nikon Nikkor Z 50mm f1.8", { wide: 1.8 }],
    ["Nikon Nikkor Z 50mm F1.8", { wide: 1.8 }],
    ["Nikon Nikkor Z 50mm f 1.8", { wide: 1.8 }],
    ["Nikon Nikkor Z 50mm ƒ/1.8", { wide: 1.8 }],
    ["Sigma 24-70mm F2.8 DG DN Art", { wide: 2.8 }],
    ["Sigma 150-600mm F4.5-6.3", { wide: 4.5, tele: 6.3 }],
    ["Canon RF 24-105mm f/4-7.1", { wide: 4, tele: 7.1 }],
    ["Canon EF 24-105mm f/4L IS USM", { wide: 4 }],
    ["Nikon AF-S NIKKOR 500mm f/5.6E PF", { wide: 5.6 }],
    // ratio forms
    ["Leica 50mm 1:2.8", { wide: 2.8 }],
    ["Leica 50mm 1: 2.8", { wide: 2.8 }],
    ["Leica 35-70mm 1:2.8-4", { wide: 2.8, tele: 4 }],
    ["Leica 35-70mm 1 : 2.8-4", { wide: 2.8, tele: 4 }],
    // cine T-stop forms
    ["Cooke S4/i 50mm T2.0", { wide: 2 }],
    ["ARRI Signature Prime 47mm T1.8", { wide: 1.8 }],
    ["Zeiss Compact Prime CP.3 50mm T/2.1", { wide: 2.1 }],
  ])("parses aperture from %s", (name, expected) => {
    expect(parseApertureFromName(name)).toEqual(expected);
  });

  it("returns null when no aperture token is present", () => {
    expect(parseApertureFromName("Nikon Nikkor Z 50mm")).toBeNull();
  });

  it("parses structured CSV rows with inferred brand, mounts, focal length, and aperture", () => {
    const parsed = parseGearBulkImportCsv(
      [
        "name,modelNumber,mounts,msrpNowUsd",
        "Nikon Nikkor Z 60mm f/2.8,MODEL-60,z-nikon,999.95",
      ].join("\n"),
    );

    expect(parsed.errors).toEqual([]);
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0]).toMatchObject({
      name: "Nikon Nikkor Z 60mm f/2.8",
      brandName: "Nikon",
      mountValues: ["z-nikon"],
      core: { msrpNowUsdCents: 99995 },
      lens: {
        focalLengthMinMm: 60,
        focalLengthMaxMm: 60,
        maxApertureWide: 2.8,
        isPrime: true,
      },
      inferred: { focalLength: true, aperture: true },
    });
  });

  it("infers zoom focal range and isPrime from the name only", () => {
    const parsed = parseGearBulkImportCsv(
      ["name,mounts", "Canon EF 8-15mm f/4L Fisheye USM,ef-canon"].join("\n"),
    );

    expect(parsed.errors).toEqual([]);
    expect(parsed.rows[0]).toMatchObject({
      lens: {
        focalLengthMinMm: 8,
        focalLengthMaxMm: 15,
        maxApertureWide: 4,
        isPrime: false,
      },
      inferred: { focalLength: true, aperture: true },
    });
  });

  it("ignores deprecated focal, aperture, link, and notes columns without warning", () => {
    const parsed = parseGearBulkImportCsv(
      [
        "name,focalLengthMinMm,focalLengthMaxMm,maxApertureWide,linkManufacturer,notes",
        "Nikon Nikkor Z 24-70mm f/2.8,8,999,1.2,https://example.com,should-ignore",
      ].join("\n"),
    );

    expect(parsed.errors).toEqual([]);
    expect(parsed.unknownHeaders).toEqual([]);
    expect(parsed.rows[0]).toMatchObject({
      lens: {
        focalLengthMinMm: 24,
        focalLengthMaxMm: 70,
        maxApertureWide: 2.8,
        isPrime: false,
      },
      core: {},
    });
    expect(parsed.rows[0]?.core).not.toHaveProperty("linkManufacturer");
    expect(parsed.rows[0]?.core).not.toHaveProperty("notes");
  });

  it("builds an LLM-friendly validation report with row identifiers", () => {
    const report = buildBulkImportValidationReport([
      {
        rowNumber: 2,
        name: "Unknown 60mm f/2.8",
        brandName: undefined,
        mountValues: ["bad-mount"],
        validations: [
          {
            level: "error",
            message: "Name must start with a known brand name.",
          },
        ],
        duplicateMessages: [
          { level: "warning", message: "Similar items found." },
        ],
      },
    ]);

    expect(report).toContain("Row 2: Unknown 60mm f/2.8");
    expect(report).toContain("Brand: (unresolved)");
    expect(report).toContain("Mounts: bad-mount");
    expect(report).toContain("ERROR: Name must start");
    expect(report).toContain("WARNING: Similar items found");
  });

  it("documents preferred image circle slugs in the field guide", () => {
    expect(BULK_IMPORT_FIELD_GUIDE).toContain("micro-4-3");
    expect(BULK_IMPORT_FIELD_GUIDE).toContain("aps-c");
    expect(BULK_IMPORT_FIELD_GUIDE).toContain("full-frame");
    expect(BULK_IMPORT_FIELD_GUIDE).toContain("medium-format-45x30");
    expect(BULK_IMPORT_FIELD_GUIDE).toContain("medium-format-55x40");
    expect(BULK_IMPORT_FIELD_GUIDE).toContain("medium-format-44x33");
    expect(BULK_IMPORT_FIELD_GUIDE).toContain("cinema-large-format");
  });

  it("documents inference-only optics and omits removed CSV columns", () => {
    expect(BULK_IMPORT_FIELD_GUIDE).toContain("inferred from names");
    expect(BULK_IMPORT_FIELD_GUIDE).toContain("decimal USD amounts");
    expect(BULK_IMPORT_FIELD_GUIDE).toContain("integer grams");
    expect(BULK_IMPORT_FIELD_GUIDE).toContain("true/false, yes/no, or 1/0");
    expect(BULK_IMPORT_FIELD_GUIDE).toContain("integer millimeters");
    expect(BULK_IMPORT_FIELD_GUIDE).not.toContain("focalLengthMinMm");
    expect(BULK_IMPORT_FIELD_GUIDE).not.toContain("maxApertureWide");
    expect(BULK_IMPORT_FIELD_GUIDE).not.toContain("linkManufacturer");
    expect(BULK_IMPORT_FIELD_GUIDE).not.toContain("notes:");
  });

  it("builds a copy-pasteable AI fix prompt with instructions and CSV", () => {
    const prompt = buildBulkImportAiFixPrompt({
      csvText: "name,mounts\nUnknownBrand 60mm f/2.8,bad-mount",
      validationReport:
        'Row 2: UnknownBrand 60mm f/2.8\n- ERROR: Unknown mount value "bad-mount".',
      fieldGuide: "mounts: Use values like z-nikon.",
    });

    expect(prompt).toContain("Return only corrected CSV text.");
    expect(prompt).toContain("Validation issues to fix:");
    expect(prompt).toContain("Row 2: UnknownBrand 60mm f/2.8");
    expect(prompt).toContain("```csv");
    expect(prompt).toContain("name,mounts");
    expect(prompt).toContain("Use mount values like z-nikon");
    expect(prompt).toContain(
      "Do not include focal length, aperture, isPrime, link, or notes columns",
    );
  });
});
