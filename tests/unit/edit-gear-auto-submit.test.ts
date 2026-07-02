import { describe, expect, it } from "vitest";

import { getInitialAutoSubmitValue } from "~/app/[locale]/(pages)/gear/_components/edit-gear/auto-submit";

describe("getInitialAutoSubmitValue", () => {
  it("defaults contributors to auto-submit when no explicit override is provided", () => {
    expect(getInitialAutoSubmitValue()).toBe(true);
  });

  it("preserves an explicit manual-review override", () => {
    expect(getInitialAutoSubmitValue(false)).toBe(false);
  });
});
