import { describe, expect, it } from "vitest";

import {
  computeHeadlineMaxFps,
  normalizeMaxFpsByShutterValue,
} from "~/app/[locale]/(pages)/gear/_components/edit-gear/camera-fps";

describe("camera FPS editing", () => {
  it("normalizes decimal strings and the legacy EFCS key", () => {
    expect(
      normalizeMaxFpsByShutterValue(
        {
          mechanical: { raw: "14.0", jpg: "14" },
          efcs: { raw: "12.5", jpg: null },
        },
        ["mechanical", "efc"],
      ),
    ).toEqual({
      mechanical: { raw: 14, jpg: 14 },
      efc: { raw: 12.5, jpg: null },
    });
  });

  it("removes unavailable and invalid entries", () => {
    expect(
      normalizeMaxFpsByShutterValue(
        {
          mechanical: { raw: "fast", jpg: undefined },
          electronic: { raw: 120, jpg: 60 },
          unknown: { raw: 10 },
        },
        ["mechanical"],
      ),
    ).toEqual({});
  });

  it("computes RAW and JPG headline maxima independently", () => {
    expect(
      computeHeadlineMaxFps({
        mechanical: { raw: 14, jpg: 14 },
        electronic: { raw: 20, jpg: 120 },
      }),
    ).toEqual({ maxRaw: 20, maxJpg: 120 });
  });
});
