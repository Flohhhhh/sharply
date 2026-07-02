import { describe,expect,it } from "vitest";

import {
  buildApertureTokenRegex,
  buildDecimalNumericTokenRegex,
  buildWholeWordTokenRegex,
  getApertureTokens,
  getLensFeatureAcronymTokens,
  getSignificantNumericTokens,
  normalizeSearchQueryNoPunct,
  parseSearchQueryTokens,
  scoreSearchTextAgainstQuery,
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

  it("parses aperture and feature acronym tokens for lens shorthand queries", () => {
    const tokens = parseSearchQueryTokens("Nikon 300mm f/4E PF");

    expect(tokens.apertureTokens).toEqual(["4"]);
    expect(tokens.focalLengthTokens).toEqual(["300"]);
    expect(tokens.activeLensFeatureAcronymTokens).toEqual(["pf"]);
  });

  it("keeps low-information acronym-only queries gated", () => {
    const tokens = parseSearchQueryTokens("is");

    expect(getLensFeatureAcronymTokens("is")).toEqual(["is"]);
    expect(tokens.activeLensFeatureAcronymTokens).toEqual([]);
    expect(tokens.isLowInformationFeatureAcronymQuery).toBe(true);
  });

  it("matches feature acronyms on token boundaries only", () => {
    const pattern = buildWholeWordTokenRegex("is");

    expect("canon ef 24-105mm f/4l is ii usm").toMatch(new RegExp(pattern, "i"));
    expect("sigma 15mm fisheye".match(new RegExp(pattern, "i"))).toBeNull();
  });

  it("matches integer aperture tokens with optional trailing lens designators", () => {
    const pattern = buildApertureTokenRegex("4");

    expect("nikon af-s nikkor 300mm f 4e pf ed vr").toMatch(
      new RegExp(pattern, "i"),
    );
    expect("nikon coolpix p4").not.toMatch(new RegExp(pattern, "i"));
  });

  it("ranks the 500mm pf prime above the 200-500 zoom for nikon 500 pf", () => {
    const primeScore = scoreSearchTextAgainstQuery({
      query: "nikon 500 pf",
      searchText: "Nikon AF-S NIKKOR 500mm f/5.6E PF ED VR",
      brandName: "Nikon",
    });
    const zoomScore = scoreSearchTextAgainstQuery({
      query: "nikon 500 pf",
      searchText: "Nikon AF-S NIKKOR 200-500mm f/5.6E ED VR",
      brandName: "Nikon",
    });

    expect(primeScore).toBeGreaterThan(zoomScore);
  });

  it("ranks the 500mm pf prime above the 200-500 zoom for nikon 500mm f/5.6", () => {
    const primeScore = scoreSearchTextAgainstQuery({
      query: "nikon 500mm f/5.6",
      searchText: "Nikon AF-S NIKKOR 500mm f/5.6E PF ED VR",
      brandName: "Nikon",
    });
    const zoomScore = scoreSearchTextAgainstQuery({
      query: "nikon 500mm f/5.6",
      searchText: "Nikon AF-S NIKKOR 200-500mm f/5.6E ED VR",
      brandName: "Nikon",
    });

    expect(primeScore).toBeGreaterThan(zoomScore);
  });

  it("favors the 300mm f/4e pf lens for shorthand Nikon queries", () => {
    const pfScore = scoreSearchTextAgainstQuery({
      query: "300mm f/4e pf",
      searchText: "Nikon AF-S NIKKOR 300mm f/4E PF ED VR",
      brandName: "Nikon",
    });
    const nonPfScore = scoreSearchTextAgainstQuery({
      query: "300mm f/4e pf",
      searchText: "Nikon AF-S NIKKOR 300mm f/4D IF-ED",
      brandName: "Nikon",
    });

    expect(getApertureTokens("300mm f/4e pf")).toEqual(["4"]);
    expect(pfScore).toBeGreaterThan(nonPfScore);
  });
});
