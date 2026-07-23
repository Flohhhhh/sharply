import { describe, expect, it } from "vitest";
import {
  resolveGearTableScope,
  toGearTableRow,
} from "~/components/table/gear-table-adapter";

describe("gear table adapter", () => {
  it("normalizes missing display fields and keeps every mount", () => {
    const row = toGearTableRow({
      id: "lens-1",
      slug: "lens-1",
      name: "Lens One",
      gearType: "LENS",
      mountNames: ["E", "L"],
      releaseDatePrecision: "UNSUPPORTED",
    });

    expect(row.mountNames).toEqual(["E", "L"]);
    expect(row.releaseDatePrecision).toBeNull();
    expect(row.sensorFormatName).toBeNull();
    expect(row.maxApertureWide).toBeNull();
  });

  it("chooses the type-specific scope only for uniform loaded rows", () => {
    const camera = toGearTableRow({
      id: "camera-1",
      slug: "camera-1",
      name: "Camera One",
      gearType: "CAMERA",
    });
    const analogCamera = toGearTableRow({
      id: "analog-1",
      slug: "analog-1",
      name: "Analog One",
      gearType: "ANALOG_CAMERA",
    });
    const lens = toGearTableRow({
      id: "lens-1",
      slug: "lens-1",
      name: "Lens One",
      gearType: "LENS",
    });

    expect(resolveGearTableScope([camera, analogCamera])).toBe("camera");
    expect(resolveGearTableScope([lens])).toBe("lens");
    expect(resolveGearTableScope([camera, lens])).toBe("mixed");
  });
});
