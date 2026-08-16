import { describe, expect, it } from "vitest";
import {
  normalizeViewfinderEyePointUpdate,
  supportsViewfinderEyePoint,
} from "~/lib/specs/viewfinder";

describe("supportsViewfinderEyePoint", () => {
  it("enables eye point for known digital and analog viewfinders", () => {
    expect(supportsViewfinderEyePoint("electronic")).toBe(true);
    expect(supportsViewfinderEyePoint("optical")).toBe(true);
    expect(supportsViewfinderEyePoint("pentaprism")).toBe(true);
  });

  it("disables eye point for unknown or absent viewfinders", () => {
    expect(supportsViewfinderEyePoint(undefined)).toBe(false);
    expect(supportsViewfinderEyePoint(null)).toBe(false);
    expect(supportsViewfinderEyePoint("")).toBe(false);
    expect(supportsViewfinderEyePoint("none")).toBe(false);
  });

  it("clears eye point when a same-payload viewfinder becomes incompatible", () => {
    expect(
      normalizeViewfinderEyePointUpdate(
        { viewfinderType: "electronic", viewfinderEyePointMm: 21 },
        { viewfinderType: "none", viewfinderEyePointMm: 18 },
      ),
    ).toEqual({ viewfinderType: "none", viewfinderEyePointMm: null });
  });

  it("validates partial eye-point updates against the stored viewfinder type", () => {
    expect(
      normalizeViewfinderEyePointUpdate(
        { viewfinderType: "none", viewfinderEyePointMm: null },
        { viewfinderEyePointMm: 21 },
      ),
    ).toEqual({ viewfinderEyePointMm: null });
    expect(
      normalizeViewfinderEyePointUpdate(
        { viewfinderType: "pentaprism", viewfinderEyePointMm: 18 },
        { viewfinderEyePointMm: 21 },
      ),
    ).toEqual({ viewfinderEyePointMm: 21 });
  });

  it("clears a stored eye point when only the viewfinder type becomes incompatible", () => {
    expect(
      normalizeViewfinderEyePointUpdate(
        { viewfinderType: "optical", viewfinderEyePointMm: 21 },
        { viewfinderType: "none" },
      ),
    ).toEqual({ viewfinderType: "none", viewfinderEyePointMm: null });
  });
});
