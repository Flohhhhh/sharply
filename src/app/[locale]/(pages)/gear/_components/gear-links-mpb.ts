import {
  getMpbMountSuffix,
  hasKnownMpbMountSuffix,
  isMpbSearchInput,
  type Market,
} from "~/lib/links/mpb";
import type { GearType } from "~/types/gear";

interface ResolveMpbLinkStateParams {
  gearType: GearType;
  linkMpb: string | null;
  mountIds?: string[] | null;
  isMpbSupported: boolean;
  market: Market | null;
}

export interface MpbLinkState {
  directHref?: string;
  directMountId: string | null;
  isUnavailable: boolean;
  shouldRenderCard: boolean;
  shouldShowChooser: boolean;
}

export function buildMpbOutHref(
  linkMpb: string,
  market: Market | null,
  mountId: string | null,
) {
  const params = new URLSearchParams({
    destinationPath: linkMpb,
  });

  if (market) {
    params.set("market", market);
  }

  if (mountId) {
    params.set("mountId", mountId);
  }

  return `/api/out/mpb?${params.toString()}`;
}

export function resolveMpbLinkState({
  gearType,
  linkMpb,
  mountIds,
  isMpbSupported,
  market,
}: ResolveMpbLinkStateParams): MpbLinkState {
  if (!linkMpb || !isMpbSupported) {
    return {
      directMountId: null,
      isUnavailable: false,
      shouldRenderCard: false,
      shouldShowChooser: false,
    };
  }

  const isLegacyMpbSearchLink = isMpbSearchInput(linkMpb);
  const uniqueMountIds = Array.from(new Set((mountIds ?? []).filter(Boolean)));
  const supportedMpbMounts = uniqueMountIds.filter((mountId) =>
    Boolean(getMpbMountSuffix(mountId)),
  );
  const hasLegacyMountedLink = hasKnownMpbMountSuffix(linkMpb);
  const shouldShowChooser =
    !isLegacyMpbSearchLink &&
    gearType === "LENS" &&
    uniqueMountIds.length > 1 &&
    supportedMpbMounts.length > 1;
  const directMountId =
    gearType === "LENS" ? (supportedMpbMounts[0] ?? null) : null;

  let directHref: string | undefined;
  if (!shouldShowChooser) {
    if (isLegacyMpbSearchLink) {
      directHref = buildMpbOutHref(linkMpb, market, null);
    } else if (gearType !== "LENS") {
      directHref = buildMpbOutHref(linkMpb, market, null);
    } else if (supportedMpbMounts.length === 1 && directMountId) {
      directHref = buildMpbOutHref(linkMpb, market, directMountId);
    } else if (hasLegacyMountedLink) {
      directHref = buildMpbOutHref(linkMpb, market, null);
    }
  }

  return {
    directHref,
    directMountId,
    isUnavailable: !shouldShowChooser && !directHref,
    shouldRenderCard: true,
    shouldShowChooser,
  };
}
