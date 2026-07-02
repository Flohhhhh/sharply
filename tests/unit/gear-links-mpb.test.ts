import { describe,expect,it } from "vitest";

import {
  buildMpbOutHref,
  resolveMpbLinkState,
} from "~/app/[locale]/(pages)/gear/_components/gear-links-mpb";

const NIKON_F_MOUNT_ID = "1e930c0c-aadb-4dd3-93ae-7f691cc93296";
const NIKON_Z_MOUNT_ID = "b79eb85d-2fb8-404f-8f63-8e8028ac27ee";
const SONY_E_MOUNT_ID = "29cd7cf2-b6af-4818-ab36-590c31aa86df";
const CANON_RF_MOUNT_ID = "21323f59-f91a-418a-8f88-09aeacd0f84d";

describe("resolveMpbLinkState", () => {
  it("builds a direct base-path MPB href for single-mount lenses", () => {
    const result = resolveMpbLinkState({
      gearType: "LENS",
      linkMpb: "/product/nikon-af-s-50mm-f-1-8g",
      mountIds: [NIKON_F_MOUNT_ID],
      isMpbSupported: true,
      market: "EU",
    });

    expect(result.shouldRenderCard).toBe(true);
    expect(result.shouldShowChooser).toBe(false);
    expect(result.isUnavailable).toBe(false);
    expect(result.directHref).toBe(
      "/api/out/mpb?destinationPath=%2Fproduct%2Fnikon-af-s-50mm-f-1-8g&market=EU",
    );
  });

  it("normalizes legacy suffixed links for direct single-mount lens clicks", () => {
    const result = resolveMpbLinkState({
      gearType: "LENS",
      linkMpb: "/product/nikon-z-50mm-f-1-8-s-nikon-z-fit",
      mountIds: [NIKON_Z_MOUNT_ID],
      isMpbSupported: true,
      market: "US",
    });

    expect(result.shouldRenderCard).toBe(true);
    expect(result.shouldShowChooser).toBe(false);
    expect(result.isUnavailable).toBe(false);
    expect(result.directHref).toBe(
      "/api/out/mpb?destinationPath=%2Fproduct%2Fnikon-z-50mm-f-1-8-s&market=US",
    );
  });

  it("shows the chooser when a lens has multiple supported MPB mounts", () => {
    const result = resolveMpbLinkState({
      gearType: "LENS",
      linkMpb: "/product/sigma-24-70mm-f-2-8-dg-dn-art",
      mountIds: [NIKON_Z_MOUNT_ID, SONY_E_MOUNT_ID],
      isMpbSupported: true,
      market: "EU",
      sonyMirrorlessVariant: "fe",
    });

    expect(result.shouldRenderCard).toBe(true);
    expect(result.shouldShowChooser).toBe(true);
    expect(result.isUnavailable).toBe(false);
    expect(result.directHref).toBeUndefined();
  });

  it("requires Sony coverage before treating Sony mirrorless as supported in the chooser", () => {
    const result = resolveMpbLinkState({
      gearType: "LENS",
      linkMpb: "/product/sigma-24-70mm-f-2-8-dg-dn-art",
      mountIds: [NIKON_Z_MOUNT_ID, SONY_E_MOUNT_ID],
      isMpbSupported: true,
      market: "EU",
    });

    expect(result.shouldRenderCard).toBe(true);
    expect(result.shouldShowChooser).toBe(false);
    expect(result.isUnavailable).toBe(false);
    expect(result.directHref).toBe(
      "/api/out/mpb?destinationPath=%2Fproduct%2Fsigma-24-70mm-f-2-8-dg-dn-art&market=EU",
    );
  });

  it("includes the Sony FE variant in chooser redirect hrefs", () => {
    expect(
      buildMpbOutHref(
        "/product/sigma-24-70mm-f-2-8-dg-dn-art",
        "EU",
        SONY_E_MOUNT_ID,
        "fe",
      ),
    ).toBe(
      `/api/out/mpb?destinationPath=%2Fproduct%2Fsigma-24-70mm-f-2-8-dg-dn-art&market=EU&mountId=${encodeURIComponent(SONY_E_MOUNT_ID)}&sonyVariant=fe`,
    );
  });

  it("includes the Canon RF-S variant in chooser redirect hrefs", () => {
    expect(
      buildMpbOutHref(
        "/product/canon-rf-s-18-150mm-f-3-5-6-3-is-stm",
        "EU",
        CANON_RF_MOUNT_ID,
        null,
        "rf-s",
      ),
    ).toBe(
      `/api/out/mpb?destinationPath=%2Fproduct%2Fcanon-rf-s-18-150mm-f-3-5-6-3-is-stm&market=EU&mountId=${encodeURIComponent(CANON_RF_MOUNT_ID)}&canonVariant=rf-s`,
    );
  });

  it("keeps non-lens links unchanged", () => {
    const result = resolveMpbLinkState({
      gearType: "CAMERA",
      linkMpb: "/product/nikon-z6-iii",
      mountIds: [NIKON_Z_MOUNT_ID],
      isMpbSupported: true,
      market: "EU",
    });

    expect(result.shouldRenderCard).toBe(true);
    expect(result.shouldShowChooser).toBe(false);
    expect(result.isUnavailable).toBe(false);
    expect(result.directHref).toBe(
      "/api/out/mpb?destinationPath=%2Fproduct%2Fnikon-z6-iii&market=EU",
    );
  });

  it("hides the MPB card entirely when the locale does not support MPB", () => {
    const result = resolveMpbLinkState({
      gearType: "LENS",
      linkMpb: "/product/nikon-af-s-50mm-f-1-8g",
      mountIds: [NIKON_F_MOUNT_ID],
      isMpbSupported: false,
      market: null,
    });

    expect(result.shouldRenderCard).toBe(false);
    expect(result.shouldShowChooser).toBe(false);
    expect(result.isUnavailable).toBe(false);
    expect(result.directHref).toBeUndefined();
  });
});
