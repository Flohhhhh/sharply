import { describe, expect, it } from "vitest";
import { getBadgeIconSvgProps } from "~/lib/badges/icon-presentation";

describe("getBadgeIconSvgProps", () => {
  it("defaults to filled currentColor", () => {
    expect(getBadgeIconSvgProps()).toEqual({ fill: "currentColor" });
    expect(getBadgeIconSvgProps(undefined)).toEqual({ fill: "currentColor" });
    expect(getBadgeIconSvgProps("fill")).toEqual({ fill: "currentColor" });
  });

  it("uses stroke mode for outline icons", () => {
    expect(getBadgeIconSvgProps("stroke")).toEqual({
      fill: "none",
      stroke: "currentColor",
    });
  });
});
