import { describe, expect, it } from "vitest";
import {
  getVariableApertureProfileEndpoints,
  normalizeApertureProfile,
} from "~/lib/lens-aperture-profile";

const bounds = {
  isPrime: false,
  focalLengthMinMm: 24,
  focalLengthMaxMm: 70,
  maxApertureWide: 2.8,
  maxApertureTele: 4,
};

describe("lens aperture profile", () => {
  it("derives locked endpoints for a variable-aperture zoom", () => {
    expect(getVariableApertureProfileEndpoints(bounds)).toEqual([
      { focalLength: 24, aperture: 2.8 },
      { focalLength: 70, aperture: 4 },
    ]);
  });

  it("rejects profiles with duplicate or out-of-range focal lengths", () => {
    const endpoints = getVariableApertureProfileEndpoints(bounds)!;
    expect(
      normalizeApertureProfile(
        [endpoints[0], { focalLength: 50, aperture: 3.5 }, { focalLength: 50, aperture: 3.6 }, endpoints[1]],
        endpoints,
      ),
    ).toBeNull();
    expect(
      normalizeApertureProfile(
        [endpoints[0], { focalLength: 80, aperture: 3.5 }, endpoints[1]],
        endpoints,
      ),
    ).toBeNull();
  });

  it("sorts valid profile points by focal length", () => {
    const endpoints = getVariableApertureProfileEndpoints(bounds)!;
    expect(
      normalizeApertureProfile(
        [endpoints[1], { focalLength: 50, aperture: 3.5 }, endpoints[0]],
        endpoints,
      ),
    ).toEqual([endpoints[0], { focalLength: 50, aperture: 3.5 }, endpoints[1]]);
  });

  it("rejects profiles whose locked endpoints no longer match the lens", () => {
    const endpoints = getVariableApertureProfileEndpoints(bounds)!;
    expect(
      normalizeApertureProfile(
        [
          { focalLength: 24, aperture: 2.8 },
          { focalLength: 50, aperture: 3.5 },
          { focalLength: 70, aperture: 4.5 },
        ],
        endpoints,
      ),
    ).toBeNull();
  });
});
