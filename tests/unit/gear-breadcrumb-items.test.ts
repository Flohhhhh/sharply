import { describe, expect, it } from "vitest";

import { buildGearBreadcrumbItems } from "~/app/(app)/(pages)/gear/_components/gear-breadcrumb-items";

describe("buildGearBreadcrumbItems", () => {
  it("builds a brand and mount-specific lens browse breadcrumb", () => {
    const items = buildGearBreadcrumbItems({
      brandName: "Canon",
      brandSlug: "canon",
      gearType: "LENS",
      mountId: "21323f59-f91a-418a-8f88-09aeacd0f84d",
    });

    expect(items).toEqual([
      { label: "Gear", href: "/browse" },
      { label: "Canon", href: "/browse/canon" },
      { label: "RF Lenses", href: "/browse/canon/lenses/rf" },
    ]);
  });

  it("falls back to the category page when the mount has no browse short name", () => {
    const items = buildGearBreadcrumbItems({
      brandName: "Nikon",
      brandSlug: "nikon",
      gearType: "LENS",
      mountId: "97066af3-1cfc-4049-a627-40da597a5bd3",
    });

    expect(items).toEqual([
      { label: "Gear", href: "/browse" },
      { label: "Nikon", href: "/browse/nikon" },
      { label: "Lenses", href: "/browse/nikon/lenses" },
    ]);
  });

  it("uses mountIds when the legacy primary mount pointer is missing", () => {
    const items = buildGearBreadcrumbItems({
      brandName: "Canon",
      brandSlug: "canon",
      gearType: "LENS",
      mountIds: ["21323f59-f91a-418a-8f88-09aeacd0f84d"],
    });

    expect(items[2]).toEqual({
      label: "RF Lenses",
      href: "/browse/canon/lenses/rf",
    });
  });

  it("maps analog cameras into the cameras browse branch", () => {
    const items = buildGearBreadcrumbItems({
      brandName: "Canon",
      brandSlug: "canon",
      gearType: "ANALOG_CAMERA",
      mountId: "4cd0ea3b-ef92-40b3-b4b1-e4baad1e165d",
    });

    expect(items).toEqual([
      { label: "Gear", href: "/browse" },
      { label: "Canon", href: "/browse/canon" },
      { label: "FD Cameras", href: "/browse/canon/cameras/fd" },
    ]);
  });
});
