import { describe, expect, it } from "vitest";

import {
  diffRecordByKeys,
  editValuesEqual,
} from "~/app/[locale]/(pages)/gear/_components/edit-gear/edit-gear-diff";

describe("edit gear diff comparison", () => {
  const original = {
    maxFpsByShutter: {
      mechanical: { raw: "14.0", jpg: "14" },
      electronic: { raw: "20", jpg: "120.0" },
    },
  };

  it("treats structurally equal FPS objects and numeric values as equal", () => {
    expect(
      editValuesEqual(
        original.maxFpsByShutter,
        {
          electronic: { jpg: 120, raw: 20 },
          mechanical: { jpg: 14, raw: 14 },
        },
        "numeric",
      ),
    ).toBe(true);
  });

  it("does not coerce numeric-looking text fields", () => {
    expect(editValuesEqual("1e3", "1000")).toBe(false);
    expect(
      diffRecordByKeys({ name: "1e3" }, { name: "1000" }, ["name"]),
    ).toEqual({ name: "1000" });
  });

  it("coerces only explicitly numeric fields", () => {
    expect(
      diffRecordByKeys(
        { maxFpsByShutter: original.maxFpsByShutter },
        {
          maxFpsByShutter: {
            mechanical: { raw: 14, jpg: 14 },
            electronic: { raw: 20, jpg: 120 },
          },
        },
        ["maxFpsByShutter"],
        { numericKeys: ["maxFpsByShutter"] },
      ),
    ).toEqual({});
  });

  it("preserves order-sensitive array comparison", () => {
    expect(
      editValuesEqual(
        ["mechanical", "electronic"],
        ["electronic", "mechanical"],
      ),
    ).toBe(false);
  });

  it("returns only genuine per-shutter FPS changes", () => {
    expect(
      diffRecordByKeys(
        original,
        {
          maxFpsByShutter: {
            mechanical: { raw: 15, jpg: 14 },
            electronic: { raw: 20, jpg: 120 },
          },
        },
        ["maxFpsByShutter"],
        { numericKeys: ["maxFpsByShutter"] },
      ),
    ).toEqual({
      maxFpsByShutter: {
        mechanical: { raw: 15, jpg: 14 },
        electronic: { raw: 20, jpg: 120 },
      },
    });
  });

  it("produces an empty diff after a value is reverted", () => {
    const changed = {
      maxFpsByShutter: {
        mechanical: { raw: 15, jpg: 14 },
        electronic: { raw: 20, jpg: 120 },
      },
    };
    expect(
      diffRecordByKeys(original, changed, ["maxFpsByShutter"], {
        numericKeys: ["maxFpsByShutter"],
      }),
    ).not.toEqual({});

    const reverted = {
      maxFpsByShutter: {
        mechanical: { raw: 14, jpg: 14 },
        electronic: { raw: 20, jpg: 120 },
      },
    };
    expect(
      diffRecordByKeys(original, reverted, ["maxFpsByShutter"], {
        numericKeys: ["maxFpsByShutter"],
      }),
    ).toEqual({});
  });
});
