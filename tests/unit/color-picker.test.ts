import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  applyHueToColor,
  applySaturationLightnessToColor,
  ColorPickerField,
  ColorPickerPanel,
  commitAlphaInput,
  commitHexInput,
  getSaturationLightnessFromPointerPosition,
  normalizeRgbaColor,
  parseAlphaInput,
  parseHexColor,
  rgbaToHex,
  rgbaToHsl,
  type RgbaColor,
} from "../../src/components/ui/color-picker";

vi.mock("@radix-ui/react-popover", () => {
  const Root = ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "popover-root" }, children);
  const Trigger = ({
    children,
    asChild,
    ...props
  }: {
    children: React.ReactNode;
    asChild?: boolean;
  }) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, props);
    }
    return React.createElement("button", props, children);
  };
  const Content = ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => React.createElement("div", { className }, children);
  const Portal = ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children);
  const Anchor = ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children);

  return {
    Root,
    Trigger,
    Content,
    Portal,
    Anchor,
  };
});

vi.mock("@radix-ui/react-slider", () => {
  const Root = ({
    children,
    value,
    ...props
  }: {
    children: React.ReactNode;
    value?: number[];
  }) =>
    React.createElement(
      "div",
      {
        "data-slot": "slider-root",
        "data-value": Array.isArray(value) ? value.join(",") : "",
        ...props,
      },
      children,
    );
  const Track = ({
    children,
    ...props
  }: {
    children: React.ReactNode;
  }) => React.createElement("div", { "data-slot": "slider-track", ...props }, children);
  const Range = (props: Record<string, unknown>) =>
    React.createElement("div", { "data-slot": "slider-range", ...props });
  const Thumb = (props: Record<string, unknown>) =>
    React.createElement("div", { "data-slot": "slider-thumb", ...props });

  return { Root, Track, Range, Thumb };
});

const BASE_COLOR: RgbaColor = {
  r: 255,
  g: 0,
  b: 128,
  a: 0.5,
};

describe("color-picker helpers", () => {
  it("normalizes incoming rgba values and disables alpha when requested", () => {
    expect(
      normalizeRgbaColor({ r: 260, g: -4, b: 127.7, a: 1.4 }, false),
    ).toEqual({
      r: 255,
      g: 0,
      b: 128,
      a: 1,
    });
  });

  it("formats and parses hex values consistently", () => {
    expect(rgbaToHex(BASE_COLOR)).toBe("#FF0080");
    expect(parseHexColor("#ff0080")).toEqual({
      r: 255,
      g: 0,
      b: 128,
      a: 1,
    });
    expect(parseHexColor("bad")).toBeNull();
  });

  it("commits hex input and preserves alpha when opacity is enabled", () => {
    const result = commitHexInput(BASE_COLOR, "#00FF00", true);
    expect(result.accepted).toBe(true);
    expect(result.nextValue).toEqual({
      r: 0,
      g: 255,
      b: 0,
      a: 0.5,
    });
  });

  it("rejects invalid hex input without emitting malformed values", () => {
    const result = commitHexInput(BASE_COLOR, "#GGGGGG", true);
    expect(result.accepted).toBe(false);
    expect(result.nextValue).toEqual(BASE_COLOR);
  });

  it("parses and commits alpha values with clamping", () => {
    expect(parseAlphaInput("1.4")).toBe(1);
    expect(parseAlphaInput("-0.2")).toBe(0);
    expect(parseAlphaInput("wat")).toBeNull();
    expect(commitAlphaInput(BASE_COLOR, "0.25", true)).toEqual({
      accepted: true,
      nextValue: {
        r: 255,
        g: 0,
        b: 128,
        a: 0.25,
      },
    });
  });

  it("forces alpha to 1 when opacity is disabled", () => {
    expect(commitAlphaInput(BASE_COLOR, "0.25", false)).toEqual({
      accepted: false,
      nextValue: {
        r: 255,
        g: 0,
        b: 128,
        a: 1,
      },
    });
  });

  it("applies hue changes while preserving alpha", () => {
    const next = applyHueToColor(BASE_COLOR, 120);
    const hsl = rgbaToHsl(next);
    expect(Math.round(hsl.h)).toBe(120);
    expect(next.a).toBe(BASE_COLOR.a);
  });

  it("applies saturation/lightness changes from the visual plane", () => {
    const next = applySaturationLightnessToColor(BASE_COLOR, 25, 75);
    const hsl = rgbaToHsl(next);
    expect(Math.round(hsl.s)).toBe(25);
    expect(Math.round(hsl.l)).toBe(75);
    expect(next.a).toBe(BASE_COLOR.a);
  });

  it("maps pointer positions into saturation and lightness values", () => {
    expect(
      getSaturationLightnessFromPointerPosition(25, 75, {
        left: 0,
        top: 0,
        width: 100,
        height: 100,
      }),
    ).toEqual({
      saturation: 25,
      lightness: 25,
    });
  });
});

describe("color-picker markup", () => {
  it("renders the field from a controlled incoming value", () => {
    const markup = renderToStaticMarkup(
      React.createElement(ColorPickerField, {
        value: BASE_COLOR,
        onValueChange: vi.fn(),
      }),
    );

    expect(markup).toContain("#FF0080");
    expect(markup).toContain("Select color");
  });

  it("renders alpha controls only when opacity is enabled", () => {
    const withoutOpacity = renderToStaticMarkup(
      React.createElement(ColorPickerPanel, {
        value: BASE_COLOR,
        onValueChange: vi.fn(),
      }),
    );
    const withOpacity = renderToStaticMarkup(
      React.createElement(ColorPickerPanel, {
        value: BASE_COLOR,
        onValueChange: vi.fn(),
        opacityEnabled: true,
      }),
    );

    expect(withoutOpacity).not.toContain("Alpha");
    expect(withOpacity).toContain("Alpha");
    expect(withOpacity).toContain("rgba(255, 0, 128, 0.5)");
  });

  it("reflects parent updates in rendered output", () => {
    const first = renderToStaticMarkup(
      React.createElement(ColorPickerField, {
        value: BASE_COLOR,
        onValueChange: vi.fn(),
      }),
    );
    const second = renderToStaticMarkup(
      React.createElement(ColorPickerField, {
        value: { r: 0, g: 255, b: 0, a: 1 },
        onValueChange: vi.fn(),
      }),
    );

    expect(first).toContain("#FF0080");
    expect(second).toContain("#00FF00");
  });

  it("renders disabled field state", () => {
    const markup = renderToStaticMarkup(
      React.createElement(ColorPickerField, {
        value: BASE_COLOR,
        onValueChange: vi.fn(),
        disabled: true,
      }),
    );

    expect(markup).toContain("disabled");
  });
});
