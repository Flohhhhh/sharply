import { describe, expect, it } from "vitest";
import { splitBrandPrefix } from "~/app/[locale]/(pages)/lists/under-construction/_components/under-construction-row-display";

describe("under-construction row display", () => {
  it("separates a duplicated brand prefix from the model name", () => {
    expect(splitBrandPrefix("Canon EOS R5", "Canon")).toEqual({
      brandPrefix: "Canon",
      modelName: "EOS R5",
    });
  });

  it("preserves names that do not begin with the complete brand name", () => {
    expect(splitBrandPrefix("Leicaflex SL", "Leica")).toEqual({
      brandPrefix: null,
      modelName: "Leicaflex SL",
    });
  });
});
