import { describe, expect, it } from "vitest";
import {
  normalizeSearchGearTypeForApi,
  normalizeSearchGearTypeForUi,
} from "~/lib/search/gear-type-param";

describe("search gearType param normalization", () => {
  it("normalizes uppercase smart-action values for UI state", () => {
    expect(normalizeSearchGearTypeForUi("LENS")).toBe("lens");
    expect(normalizeSearchGearTypeForUi("CAMERA")).toBe("camera");
    expect(normalizeSearchGearTypeForUi("ANALOG_CAMERA")).toBe(
      "analog-camera",
    );
  });

  it("normalizes both UI and canonical values for API requests", () => {
    expect(normalizeSearchGearTypeForApi("lens")).toBe("LENS");
    expect(normalizeSearchGearTypeForApi("LENS")).toBe("LENS");
    expect(normalizeSearchGearTypeForApi("camera")).toBe("CAMERA");
    expect(normalizeSearchGearTypeForApi("ANALOG_CAMERA")).toBe(
      "ANALOG_CAMERA",
    );
  });
});
