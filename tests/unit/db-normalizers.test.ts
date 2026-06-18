import { describe,expect,it } from "vitest";

import { normalizeProposalPayloadForDb } from "~/server/db/normalizers";

describe("normalizeProposalPayloadForDb", () => {
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
});
