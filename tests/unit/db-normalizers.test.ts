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
});
