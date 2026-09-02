import { describe,expect,it } from "vitest";

import { getActiveHeadingId } from "~/components/rich-text/table-of-contents-utils";

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
