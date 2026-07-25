import { describe, expect, it } from "vitest";
import {
  isLensOpticsIncomplete,
  proposeLensOpticsBackfillFromName,
} from "~/lib/admin/lens-optics-backfill";

const emptyOptics = {
  focalLengthMinMm: null,
  focalLengthMaxMm: null,
  isPrime: null,
  maxApertureWide: null,
  maxApertureTele: null,
};

describe("proposeLensOpticsBackfillFromName", () => {
  it("fills zoom focal range, isPrime, and aperture from the name", () => {
    const proposal = proposeLensOpticsBackfillFromName(
      "Canon EF 8-15mm f/4L Fisheye USM",
      emptyOptics,
    );

    expect(proposal.actionable).toBe(true);
    expect(proposal.proposed).toEqual({
      focalLengthMinMm: 8,
      focalLengthMaxMm: 15,
      isPrime: false,
      maxApertureWide: 4,
    });
    expect(proposal.fills).toEqual(
      expect.arrayContaining(["focalLength", "isPrime", "maxApertureWide"]),
    );
  });

  it("fills prime focal pair and isPrime from a single mm token", () => {
    const proposal = proposeLensOpticsBackfillFromName(
      "Nikon Nikkor Z 60mm f/2.8",
      emptyOptics,
    );

    expect(proposal.proposed).toMatchObject({
      focalLengthMinMm: 60,
      focalLengthMaxMm: 60,
      isPrime: true,
      maxApertureWide: 2.8,
    });
  });

  it("fills optics from glued focal+aperture tokens used by Fujifilm names", () => {
    const proposal = proposeLensOpticsBackfillFromName(
      "Fujifilm XF23mmF2 R WR",
      emptyOptics,
    );

    expect(proposal.proposed).toMatchObject({
      focalLengthMinMm: 23,
      focalLengthMaxMm: 23,
      isPrime: true,
      maxApertureWide: 2,
    });
  });

  it("fills aperture only when focal and isPrime already exist", () => {
    const proposal = proposeLensOpticsBackfillFromName(
      "Sigma 150-600mm F4.5-6.3",
      {
        focalLengthMinMm: 150,
        focalLengthMaxMm: 600,
        isPrime: false,
        maxApertureWide: null,
        maxApertureTele: null,
      },
    );

    expect(proposal.proposed).toEqual({
      maxApertureWide: 4.5,
      maxApertureTele: 6.3,
    });
    expect(proposal.fills).toEqual(["maxApertureWide", "maxApertureTele"]);
  });

  it("never overwrites existing optics values", () => {
    const proposal = proposeLensOpticsBackfillFromName(
      "Nikon Nikkor Z 24-70mm f/2.8",
      {
        focalLengthMinMm: 24,
        focalLengthMaxMm: 70,
        isPrime: false,
        maxApertureWide: 2.8,
        maxApertureTele: null,
      },
    );

    expect(proposal.actionable).toBe(false);
    expect(proposal.proposed).toEqual({});
    expect(proposal.fills).toEqual([]);
  });

  it("derives isPrime from existing focals when name has no focal token", () => {
    const proposal = proposeLensOpticsBackfillFromName("Mystery Lens", {
      focalLengthMinMm: 50,
      focalLengthMaxMm: 50,
      isPrime: null,
      maxApertureWide: 1.8,
      maxApertureTele: null,
    });

    expect(proposal.proposed).toEqual({ isPrime: true });
    expect(proposal.fills).toEqual(["isPrime"]);
  });

  it("does not propose when the name has no high-confidence optics tokens", () => {
    const proposal = proposeLensOpticsBackfillFromName(
      "Generic Lens Without Specs",
      emptyOptics,
    );

    expect(proposal.actionable).toBe(false);
    expect(proposal.proposed).toEqual({});
    expect(proposal.missing).toEqual([
      "focalLength",
      "isPrime",
      "maxApertureWide",
    ]);
  });

  it("fills both focal sides from name when only min is present", () => {
    const proposal = proposeLensOpticsBackfillFromName(
      "Canon EF 8-15mm f/4L Fisheye USM",
      {
        ...emptyOptics,
        focalLengthMinMm: 8,
      },
    );

    expect(proposal.proposed.focalLengthMinMm).toBe(8);
    expect(proposal.proposed.focalLengthMaxMm).toBe(15);
    expect(proposal.fills).toContain("focalLength");
  });
});

describe("isLensOpticsIncomplete", () => {
  it("detects any missing construction optic", () => {
    expect(isLensOpticsIncomplete(emptyOptics)).toBe(true);
    expect(
      isLensOpticsIncomplete({
        focalLengthMinMm: 50,
        focalLengthMaxMm: 50,
        isPrime: true,
        maxApertureWide: 1.8,
        maxApertureTele: null,
      }),
    ).toBe(false);
  });
});
