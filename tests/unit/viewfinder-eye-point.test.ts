import { describe, expect, it } from "vitest";
import { supportsViewfinderEyePoint } from "~/lib/specs/viewfinder";

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
});
