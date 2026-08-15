import { describe, expect, it } from "vitest";
import {
  HISTORY_CHART_ACTIVE_DOT_STYLE,
  HISTORY_CHART_DOT_STYLE,
  MINI_CHART_DOT_STYLE,
} from "../../src/app/[locale]/(pages)/(tools)/exif-viewer/_components/exif-tracking-chart-marker-styles";

describe("EXIF tracking chart markers", () => {
  it("uses background centers and foreground rings in both chart sizes", () => {
    expect(HISTORY_CHART_DOT_STYLE).toMatchObject({
      fill: "var(--background)",
      stroke: "var(--foreground)",
      strokeWidth: 2,
    });
    expect(MINI_CHART_DOT_STYLE).toMatchObject({
      fill: "var(--background)",
      stroke: "var(--foreground)",
      strokeWidth: 1.75,
    });
  });

  it("makes the active history marker larger without losing its ring", () => {
    expect(HISTORY_CHART_ACTIVE_DOT_STYLE).toEqual({
      fill: "var(--background)",
      stroke: "var(--foreground)",
      strokeWidth: 2.5,
      r: 5,
    });
  });
});
