import { describe, expect, it } from "vitest";

import {
  createUniqueHeadingId,
  getActiveHeadingId,
} from "~/components/rich-text/table-of-contents-utils";

describe("createUniqueHeadingId", () => {
  it("keeps non-Latin headings in Unicode-safe slugs", () => {
    expect(createUniqueHeadingId("カメラ 設定", 0, new Set())).toBe(
      "カメラ-設定",
    );
  });

  it("deduplicates repeated headings with stable suffixes", () => {
    const usedIds = new Set<string>();

    expect(createUniqueHeadingId("Lens Tests", 0, usedIds)).toBe("lens-tests");
    expect(createUniqueHeadingId("Lens Tests", 1, usedIds)).toBe(
      "lens-tests-2",
    );
    expect(createUniqueHeadingId("Lens Tests", 2, usedIds)).toBe(
      "lens-tests-3",
    );
  });

  it("uses a deterministic non-empty fallback when no slug remains", () => {
    expect(createUniqueHeadingId("📷", 3, new Set())).toBe("heading-4");
  });
});

describe("getActiveHeadingId", () => {
  const headings = [
    { id: "first", top: -240 },
    { id: "second", top: 80 },
    { id: "third", top: 360 },
  ];

  it("selects the last heading that crossed the reading line", () => {
    expect(getActiveHeadingId(headings, 112, false)).toBe("second");
  });

  it("keeps the first heading active before later headings cross", () => {
    expect(
      getActiveHeadingId(
        headings.map((heading, index) => ({
          ...heading,
          top: 240 + index * 200,
        })),
        112,
        false,
      ),
    ).toBe("first");
  });

  it("activates the final heading at the bottom of the page", () => {
    expect(getActiveHeadingId(headings, 112, true)).toBe("third");
  });

  it("handles an article without headings", () => {
    expect(getActiveHeadingId([], 112, false)).toBe("");
  });
});
