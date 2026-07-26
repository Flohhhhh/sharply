import { describe, expect, it } from "vitest";
import {
  getCompletedSpecLocks,
  isCompletedSpecFieldLocked,
} from "~/lib/gear/completed-spec-edit-policy";
import type { GearItem } from "~/types/gear";

function lens(overrides: Partial<GearItem["lensSpecs"]> = {}) {
  return {
    gearType: "LENS",
    mountId: null,
    mountIds: [],
    lensSpecs: overrides,
  } as unknown as GearItem;
}

describe("completed spec edit policy", () => {
  it("does not lock a partially completed focal-length group", () => {
    const locks = getCompletedSpecLocks(
      lens({ focalLengthMinMm: 24, focalLengthMaxMm: null, isPrime: null }),
    );

    expect(isCompletedSpecFieldLocked(locks, "lens", "focalLengthMinMm")).toBe(
      false,
    );
  });

  it("locks every member once the focal-length group is complete", () => {
    const locks = getCompletedSpecLocks(
      lens({ focalLengthMinMm: 24, focalLengthMaxMm: 70, isPrime: false }),
    );

    expect(isCompletedSpecFieldLocked(locks, "lens", "focalLengthMinMm")).toBe(
      true,
    );
    expect(isCompletedSpecFieldLocked(locks, "lens", "focalLengthMaxMm")).toBe(
      true,
    );
    expect(isCompletedSpecFieldLocked(locks, "lens", "isPrime")).toBe(true);
  });

  it("does not lock an invalid zero-valued numeric spec", () => {
    const locks = getCompletedSpecLocks({
      gearType: "CAMERA",
      mountId: null,
      mountIds: [],
      cameraSpecs: { resolutionMp: "0", sensorFormatId: null },
    } as unknown as GearItem);

    expect(isCompletedSpecFieldLocked(locks, "camera", "resolutionMp")).toBe(
      false,
    );
  });
});
