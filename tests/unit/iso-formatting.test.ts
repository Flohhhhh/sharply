import { describe, expect, it } from "vitest";

import {
  formatIsoOption,
  formatIsoRange,
  formatIsoValue,
} from "~/lib/format/iso";

describe("ISO formatting", () => {
  it("formats valid ISO values", () => {
    expect(formatIsoValue("6400")).toBe("ISO 6,400");
    expect(formatIsoValue(6553600)).toBe("ISO 6,553,600");
    expect(formatIsoValue(0)).toBeUndefined();
    expect(formatIsoValue(6400.5)).toBeUndefined();
  });

  it("uses the active locale for thousands separators", () => {
    expect(formatIsoValue(204800, "de-DE")).toBe("ISO 204.800");
  });

  it("formats select options with thousands separators", () => {
    expect(formatIsoOption(204800)).toBe("ISO 204,800");
    expect(formatIsoOption(6553600)).toBe("ISO 6,553,600");
  });

  it.each([
    [50, 204800, "ISO 50 - 204,800"],
    [50, null, "ISO 50+"],
    [null, 204800, "ISO ≤ 204,800"],
    [null, null, undefined],
  ])("formats expanded ISO range %o / %o", (min, max, expected) => {
    expect(formatIsoRange(min, max)).toBe(expected);
  });

  it("can preserve the native range's full-bounds-only behavior", () => {
    expect(formatIsoRange(50, null, { allowPartial: false })).toBeUndefined();
  });
});
