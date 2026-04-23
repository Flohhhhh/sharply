import { describe,expect,it } from "vitest";

import {
  buildBrowseStaticParams,
  shouldPrebuildHeavyRouteLocale,
  shouldPrebuildRecommendedLensesCharts,
} from "~/lib/static-generation";

describe("static generation helpers", () => {
  it("prebuilds heavy routes only for the default locale", () => {
    expect(shouldPrebuildHeavyRouteLocale("en")).toBe(true);
    expect(shouldPrebuildHeavyRouteLocale("ja")).toBe(false);
  });

  it("does not prebuild hidden recommended lenses charts", () => {
    expect(shouldPrebuildRecommendedLensesCharts()).toBe(false);
  });

  it("builds browse params without mount routes when disabled", () => {
    const params = buildBrowseStaticParams({
      brands: [
        { id: "canon", slug: "canon" },
        { id: "nikon", slug: "nikon" },
      ],
      mounts: [
        { brand_id: "canon", short_name: "rf" },
        { brand_id: "nikon", short_name: "z" },
      ],
      includeMountRoutes: false,
    });

    expect(params).toEqual([
      { segments: [] },
      { segments: ["canon"] },
      { segments: ["canon", "cameras"] },
      { segments: ["canon", "lenses"] },
      { segments: ["nikon"] },
      { segments: ["nikon", "cameras"] },
      { segments: ["nikon", "lenses"] },
    ]);
  });

  it("includes mount routes when requested", () => {
    const params = buildBrowseStaticParams({
      brands: [{ id: "canon", slug: "canon" }],
      mounts: [
        { brand_id: "canon", short_name: "rf" },
        { brand_id: "canon", short_name: null },
      ],
      includeMountRoutes: true,
    });

    expect(params).toContainEqual({ segments: ["canon", "cameras", "rf"] });
    expect(params).toContainEqual({ segments: ["canon", "lenses", "rf"] });
    expect(params).not.toContainEqual({
      segments: ["canon", "cameras", "null"],
    });
  });
});
