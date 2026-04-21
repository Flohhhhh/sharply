import { describe, expect, it } from "vitest";

import {
  resolveMpbLinkState,
} from "~/app/[locale]/(pages)/gear/_components/gear-links-mpb";

const NIKON_F_MOUNT_ID = "1e930c0c-aadb-4dd3-93ae-7f691cc93296";

describe("resolveMpbLinkState", () => {
  it("builds a direct MPB href for supported locales", () => {
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
      "/api/out/mpb?destinationPath=%2Fproduct%2Fnikon-af-s-50mm-f-1-8g&market=EU&mountId=1e930c0c-aadb-4dd3-93ae-7f691cc93296",
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
