import { describe, expect, it } from "vitest";

import { normalizeProposalPayloadForDb } from "~/server/db/normalizers";

describe("normalizeProposalPayloadForDb", () => {
  it("normalizes a lens aperture profile into focal-length order", () => {
    expect(
      normalizeProposalPayloadForDb({
        lens: {
          apertureProfileJson: [
            { focalLength: 70, aperture: 4 },
            { focalLength: 24, aperture: 2.8 },
            { focalLength: 50, aperture: 3.5 },
          ],
        },
      }),
    ).toEqual({
      lens: {
        apertureProfileJson: [
          { focalLength: 24, aperture: 2.8 },
          { focalLength: 50, aperture: 3.5 },
          { focalLength: 70, aperture: 4 },
        ],
      },
    });
  });

  it("rejects duplicate focal lengths in a lens aperture profile", () => {
    expect(() =>
      normalizeProposalPayloadForDb({
        lens: {
          apertureProfileJson: [
            { focalLength: 24, aperture: 2.8 },
            { focalLength: 24, aperture: 3.5 },
          ],
        },
      }),
    ).toThrow("Invalid aperture profile");
  });

  it("preserves true for camera yes-only booleans", () => {
    expect(
      normalizeProposalPayloadForDb({
        camera: {
          hasIlluminatedButtons: true,
        },
      }),
    ).toEqual({
      camera: {
        hasIlluminatedButtons: true,
      },
    });
  });

  it("preserves false for camera yes-only booleans", () => {
    expect(
      normalizeProposalPayloadForDb({
        camera: {
          hasIlluminatedButtons: false,
        },
      }),
    ).toEqual({
      camera: {
        hasIlluminatedButtons: false,
      },
    });
  });

  it("preserves null for camera yes-only booleans", () => {
    expect(
      normalizeProposalPayloadForDb({
        camera: {
          hasIlluminatedButtons: null,
        },
      }),
    ).toEqual({
      camera: {
        hasIlluminatedButtons: null,
      },
    });
  });

  it.each([
    [true, true],
    [false, false],
    [null, null],
    ["true", true],
    ["false", false],
  ])("normalizes camera autofocus value %o", (input, expected) => {
    expect(
      normalizeProposalPayloadForDb({
        camera: { hasAutofocus: input },
      }),
    ).toEqual({
      camera: { hasAutofocus: expected },
    });
  });

  it("drops invalid camera autofocus values", () => {
    expect(
      normalizeProposalPayloadForDb({
        camera: { hasAutofocus: "sometimes" },
      }),
    ).toEqual({});
  });

  it.each([
    [true, true],
    [false, false],
    [null, null],
    ["true", true],
    ["false", false],
  ])("normalizes camera video capability value %o", (input, expected) => {
    expect(
      normalizeProposalPayloadForDb({
        camera: { hasVideo: input },
      }),
    ).toEqual({
      camera: { hasVideo: expected },
    });
  });

  it("drops invalid camera video capability values", () => {
    expect(
      normalizeProposalPayloadForDb({
        camera: { hasVideo: "sometimes" },
      }),
    ).toEqual({});
  });

  it("preserves analog max continuous fps decimals", () => {
    expect(
      normalizeProposalPayloadForDb({
        analogCamera: {
          maxContinuousFps: "3.5",
        },
      }),
    ).toEqual({
      analogCamera: {
        maxContinuousFps: 3.5,
      },
    });
  });

  it("preserves null when analog max continuous fps is cleared", () => {
    expect(
      normalizeProposalPayloadForDb({
        analogCamera: {
          maxContinuousFps: null,
        },
      }),
    ).toEqual({
      analogCamera: {
        maxContinuousFps: null,
      },
    });
  });

  it("drops invalid analog max continuous fps values", () => {
    expect(
      normalizeProposalPayloadForDb({
        analogCamera: {
          maxContinuousFps: "fast",
        },
      }),
    ).toEqual({});
  });

  it("normalizes discontinued date and precision", () => {
    expect(
      normalizeProposalPayloadForDb({
        core: {
          discontinuedDate: "2024-06-15",
          discontinuedDatePrecision: "month",
        },
      }),
    ).toEqual({
      core: {
        discontinuedDate: new Date(Date.UTC(2024, 5, 15)),
        discontinuedDatePrecision: "MONTH",
      },
    });
  });

  it("allows clearing discontinued date fields", () => {
    expect(
      normalizeProposalPayloadForDb({
        core: {
          discontinuedDate: null,
          discontinuedDatePrecision: null,
        },
      }),
    ).toEqual({
      core: {
        discontinuedDate: null,
        discontinuedDatePrecision: null,
      },
    });
  });

  it("drops invalid discontinued date precision", () => {
    expect(
      normalizeProposalPayloadForDb({
        core: {
          discontinuedDatePrecision: "WEEK",
        },
      }),
    ).toEqual({});
  });

  it("drops overflowed discontinued calendar dates", () => {
    expect(
      normalizeProposalPayloadForDb({
        core: {
          discontinuedDate: "2024-02-31",
        },
      }),
    ).toEqual({});
    expect(
      normalizeProposalPayloadForDb({
        core: {
          discontinuedDate: "2024-13-01",
        },
      }),
    ).toEqual({});
  });
});
