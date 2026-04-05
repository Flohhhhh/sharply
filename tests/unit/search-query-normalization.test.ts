import { describe, expect, it } from "vitest";

import {
  buildDecimalNumericTokenRegex,
  getSignificantNumericTokens,
  normalizeSearchQueryNoPunct,
  shouldGateSingleNumericToken,
} from "~/server/search/query-normalization";

describe("search query normalization", () => {
  it("keeps decimal aperture tokens significant", () => {
    expect(
      getSignificantNumericTokens("Sigma 15mm F1.4 DC Contemporary"),
    ).toEqual(["1.4"]);
  });

  it("removes slashes and dots from normalized queries", () => {
    expect(normalizeSearchQueryNoPunct("Sigma 15mm f/1.4 DC")).toBe(
      "sigma15mmf14dc",
    );
  });

  it("builds a regex that matches spaced decimal tokens in search_name", () => {
    const pattern = buildDecimalNumericTokenRegex("1.4");

    expect(pattern).toBe("(^|[^0-9])1[^0-9]+4([^0-9]|$)");
    expect("sigma 15mm f1 4 dc contemporary").toMatch(new RegExp(pattern!));
    expect("sigma 15mm f14 dc contemporary").not.toMatch(new RegExp(pattern!));
  });

  it("gates lone decimal queries even without strong parts", () => {
    expect(
      shouldGateSingleNumericToken({
        numericTokens: ["1.4"],
        strongParts: [],
        normalizedQueryNoPunct: "14",
      }),
    ).toBe(true);
  });

  it("does not gate lone short integers without strong parts", () => {
    expect(
      shouldGateSingleNumericToken({
        numericTokens: ["14"],
        strongParts: [],
        normalizedQueryNoPunct: "14",
      }),
    ).toBe(false);
  });
});
