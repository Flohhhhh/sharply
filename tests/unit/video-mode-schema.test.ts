/*
These tests protect video mode cleanup logic that feeds camera specs and UI data.
They use simple sample inputs to confirm normalization, sorting, strict validation, and output mapping.
This catches malformed mode data before it leaks into stored or displayed results.
*/

import { describe, expect, it } from "vitest";
import {
  coerceVideoModeList,
  normalizeVideoModes,
  normalizedToCameraVideoModes,
  slugifyResolutionKey,
  videoModesEqual,
} from "~/lib/video/mode-schema";

describe("video mode schema utilities", () => {
  it("slugifies resolution keys and falls back to custom when empty", () => {
    expect(slugifyResolutionKey("  4K UHD  ")).toBe("4k-uhd");
    expect(slugifyResolutionKey("%%%")).toBe("custom");
  });

  it("normalizes dimensions and sorts modes deterministically", () => {
    const normalized = normalizeVideoModes([
      {
        resolutionKey: "8K",
        resolutionLabel: "8K",
        resolutionHorizontal: -7680,
        resolutionVertical: 4320,
        fps: 60,
        codecLabel: "H.265",
        bitDepth: 10,
        cropFactor: true,
        notes: null,
      },
      {
        resolutionKey: "4K",
        resolutionLabel: "4K",
        resolutionHorizontal: 3840,
        resolutionVertical: 2160,
        fps: 24,
        codecLabel: "H.264",
        bitDepth: 8,
        cropFactor: false,
        notes: null,
      },
    ]);

    expect(normalized.map((mode) => mode.resolutionKey)).toEqual(["4k", "8k"]);
    expect(normalized[1]).toMatchObject({
      resolutionHorizontal: null,
      resolutionVertical: 4320,
      notes: null,
      cropFactor: true,
    });
  });

  it("drops invalid entries in non-strict mode", () => {
    const normalized = coerceVideoModeList([
      {
        resolutionLabel: "4K",
        resolutionHorizontal: 3840,
        resolutionVertical: 2160,
        fps: 30,
        codecLabel: "H.265",
        bitDepth: 10,
        cropFactor: false,
      },
      {
        resolutionLabel: "",
        fps: 0,
        codecLabel: "",
        bitDepth: 0,
      },
    ]);

    expect(normalized).toHaveLength(1);
    expect(normalized[0]?.resolutionKey).toBe("4k");
  });

  it("throws with the failing index in strict mode", () => {
    expect(() =>
      coerceVideoModeList(
        [
          {
            resolutionLabel: "4K",
            resolutionHorizontal: 3840,
            resolutionVertical: 2160,
            fps: 30,
            codecLabel: "H.265",
            bitDepth: 10,
            cropFactor: false,
          },
          {
            resolutionLabel: "",
            fps: 0,
            codecLabel: "",
            bitDepth: 0,
          },
        ],
        { strict: true },
      ),
    ).toThrow("Invalid video mode at index 1");
  });

  it("compares normalized lists correctly for equality", () => {
    const left = normalizeVideoModes([
      {
        resolutionLabel: "4K",
        resolutionHorizontal: 3840,
        resolutionVertical: 2160,
        fps: 30,
        codecLabel: "H.265",
        bitDepth: 10,
        cropFactor: false,
      },
    ]);
    const right = normalizeVideoModes([
      {
        resolutionLabel: "4K",
        resolutionHorizontal: 3840,
        resolutionVertical: 2160,
        fps: 30,
        codecLabel: "H.265",
        bitDepth: 10,
        cropFactor: false,
      },
    ]);
    const changed = normalizeVideoModes([
      {
        resolutionLabel: "4K",
        resolutionHorizontal: 3840,
        resolutionVertical: 2160,
        fps: 60,
        codecLabel: "H.265",
        bitDepth: 10,
        cropFactor: false,
      },
    ]);

    expect(videoModesEqual(left, right)).toBe(true);
    expect(videoModesEqual(left, changed)).toBe(false);
  });

  it("maps normalized modes into camera video rows with stable ids", () => {
    const normalized = normalizeVideoModes([
      {
        resolutionLabel: "4K",
        resolutionHorizontal: 3840,
        resolutionVertical: 2160,
        fps: 30,
        codecLabel: "H.265",
        bitDepth: 10,
        cropFactor: false,
      },
      {
        resolutionLabel: "4K",
        resolutionHorizontal: 3840,
        resolutionVertical: 2160,
        fps: 60,
        codecLabel: "H.265",
        bitDepth: 10,
        cropFactor: false,
      },
    ]);

    const rows = normalizedToCameraVideoModes(normalized, { gearId: "gear-123" });

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      id: "4k-30-10-0",
      gearId: "gear-123",
      resolutionKey: "4k",
    });
    expect(rows[1]).toMatchObject({
      id: "4k-60-10-1",
      gearId: "gear-123",
    });
  });
});
