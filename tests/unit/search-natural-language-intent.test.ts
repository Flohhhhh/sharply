import { describe, expect, it, vi } from "vitest";
import type { GearSuggestion } from "~/types/search";
import { parseNaturalLanguageSearchIntent } from "~/server/search/natural-language-intent";

function makeCameraMatch(
  overrides: Partial<GearSuggestion & { mountValue?: string | null }> = {},
): GearSuggestion & { mountValue?: string | null } {
  return {
    id: "gear:camera-1",
    kind: "camera",
    type: "gear",
    gearId: "camera-1",
    href: "/gear/nikon-d5300",
    title: "Nikon D5300",
    label: "Nikon D5300",
    subtitle: "Camera",
    relevance: 1,
    brandName: "Nikon",
    canonicalName: "Nikon D5300",
    localizedName: "Nikon D5300",
    matchedName: "Nikon D5300",
    matchSource: "canonical",
    isBestMatch: true,
    gearType: "CAMERA",
    mountValue: "f-nikon",
    ...overrides,
  };
}

describe("parseNaturalLanguageSearchIntent", () => {
  it("parses brand lens searches and leaves no query remainder when fully consumed", async () => {
    const intent = await parseNaturalLanguageSearchIntent(
      "Canon lenses",
      vi.fn(),
    );

    expect(intent).toEqual({
      kind: "brand-lenses",
      subject: "Canon",
      filters: {
        gearType: "LENS",
        brand: "canon",
      },
    });
  });

  it("parses mount lens searches with the canonical mount slug", async () => {
    const intent = await parseNaturalLanguageSearchIntent(
      "Z mount lenses",
      vi.fn(),
    );

    expect(intent).toEqual({
      kind: "mount-lenses",
      subject: "Nikon Z",
      filters: {
        gearType: "LENS",
        mount: "z-nikon",
      },
    });
  });

  it("parses brand + mount + lens searches into both brand and mount filters", async () => {
    const intent = await parseNaturalLanguageSearchIntent(
      "Nikon Z lenses",
      vi.fn(),
    );

    expect(intent).toEqual({
      kind: "mount-lenses",
      subject: "Nikon Z",
      filters: {
        gearType: "LENS",
        brand: "nikon",
        mount: "z-nikon",
      },
    });
  });

  it("parses brand camera searches and preserves trailing unparsed text", async () => {
    const intent = await parseNaturalLanguageSearchIntent(
      "Canon cameras cheap",
      vi.fn(),
    );

    expect(intent).toEqual({
      kind: "brand-cameras",
      subject: "Canon",
      filters: {
        gearType: "CAMERA",
        brand: "canon",
        q: "cheap",
      },
    });
  });

  it("trims leading punctuation and parses brand + mount + camera searches", async () => {
    const intent = await parseNaturalLanguageSearchIntent(
      ",Canon RF Cameras",
      vi.fn(),
    );

    expect(intent).toEqual({
      kind: "mount-cameras",
      subject: "Canon RF",
      filters: {
        gearType: "CAMERA",
        brand: "canon",
        mount: "rf-canon",
      },
    });
  });

  it("parses multi-part mount slugs using canonical mount metadata", async () => {
    const intent = await parseNaturalLanguageSearchIntent(
      "Canon EF-M lenses",
      vi.fn(),
    );

    expect(intent).toEqual({
      kind: "mount-lenses",
      subject: "Canon EF-M",
      filters: {
        gearType: "LENS",
        brand: "canon",
        mount: "ef-m-canon",
      },
    });
  });

  it("uses the matched camera mount for lens compatibility searches", async () => {
    const resolver = vi.fn(async (query: string) =>
      query === "D5300" ? makeCameraMatch() : null,
    );

    const intent = await parseNaturalLanguageSearchIntent(
      "lenses for D5300 portrait",
      resolver,
    );

    expect(intent).toEqual({
      kind: "lenses-for-camera",
      subject: "Nikon D5300",
      filters: {
        gearType: "LENS",
        mount: "f-nikon",
        q: "portrait",
      },
    });
  });

  it("falls back when the mount token is ambiguous", async () => {
    const intent = await parseNaturalLanguageSearchIntent(
      "S mount lenses",
      vi.fn(),
    );

    expect(intent).toBeNull();
  });

  it("falls back when the camera side does not resolve to a single match", async () => {
    const intent = await parseNaturalLanguageSearchIntent(
      "lenses for some mystery camera",
      vi.fn(async () => null),
    );

    expect(intent).toBeNull();
  });
});
