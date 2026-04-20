import { describe, expect, it } from "vitest";

import { buildGearBreadcrumbItems } from "~/app/[locale]/(pages)/gear/_components/gear-breadcrumb-items";

describe("buildGearBreadcrumbItems", () => {
  it("builds the full breadcrumb for a Nikon native Z lens", () => {
    const items = buildGearBreadcrumbItems({
      brandId: "a19fbe71-3a17-4095-8d79-f40eb5475480",
      brandName: "Nikon",
      brandSlug: "nikon",
      gearType: "LENS",
      mountId: "b79eb85d-2fb8-404f-8f63-8e8028ac27ee",
    });

    expect(items).toEqual([
      { label: "Gear", href: "/browse" },
      { label: "Nikon", href: "/browse/nikon" },
      { label: "Z Lenses", href: "/browse/nikon/lenses/z" },
    ]);
  });

  it("falls back to the category page when the mount has no browse short name", () => {
    const items = buildGearBreadcrumbItems({
      brandId: "a19fbe71-3a17-4095-8d79-f40eb5475480",
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
      brandId: "7df18188-0939-4241-9ca7-6561c6e233e1",
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
      brandId: "7df18188-0939-4241-9ca7-6561c6e233e1",
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

  it("falls back to the category page for multi-mount lenses", () => {
    const items = buildGearBreadcrumbItems({
      brandId: "c58b9ef7-4aa6-46c9-b1bb-5a9779b2a424",
      brandName: "Sigma",
      brandSlug: "sigma",
      gearType: "LENS",
      mountId: "21323f59-f91a-418a-8f88-09aeacd0f84d",
      mountIds: [
        "21323f59-f91a-418a-8f88-09aeacd0f84d",
        "29cd7cf2-b6af-4818-ab36-590c31aa86df",
      ],
    });

    expect(items).toEqual([
      { label: "Gear", href: "/browse" },
      { label: "Sigma", href: "/browse/sigma" },
      { label: "Lenses", href: "/browse/sigma/lenses" },
    ]);
  });

  it("uses the partial breadcrumb for a Sigma lens on a non-native mount", () => {
    const items = buildGearBreadcrumbItems({
      brandId: "c58b9ef7-4aa6-46c9-b1bb-5a9779b2a424",
      brandName: "Sigma",
      brandSlug: "sigma",
      gearType: "LENS",
      mountId: "21323f59-f91a-418a-8f88-09aeacd0f84d",
    });

    expect(items).toEqual([
      { label: "Gear", href: "/browse" },
      { label: "Sigma", href: "/browse/sigma" },
      { label: "Lenses", href: "/browse/sigma/lenses" },
    ]);
  });
});
