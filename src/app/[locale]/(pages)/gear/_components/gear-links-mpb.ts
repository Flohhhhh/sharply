import {
  getMpbMountSuffix,
  hasKnownMpbMountSuffix,
  isMpbSearchInput,
  normalizeMpbLinkInput,
  type CanonMirrorlessVariant,
  type Market,
  type SonyMirrorlessVariant,
} from "~/lib/links/mpb";
import type { GearType } from "~/types/gear";

interface ResolveMpbLinkStateParams {
  gearType: GearType;
  linkMpb: string | null;
  mountIds?: string[] | null;
  isMpbSupported: boolean;
  market: Market | null;
  sonyMirrorlessVariant?: SonyMirrorlessVariant | null;
  canonMirrorlessVariant?: CanonMirrorlessVariant | null;
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
  sonyMirrorlessVariant?: SonyMirrorlessVariant | null,
  canonMirrorlessVariant?: CanonMirrorlessVariant | null,
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

  if (sonyMirrorlessVariant) {
    params.set("sonyVariant", sonyMirrorlessVariant);
  }

  if (canonMirrorlessVariant) {
    params.set("canonVariant", canonMirrorlessVariant);
  }

  return `/api/out/mpb?${params.toString()}`;
}

function getDirectLensDestinationPath(linkMpb: string) {
  const normalizedLink = normalizeMpbLinkInput(linkMpb);
  return normalizedLink.kind === "product"
    ? normalizedLink.normalizedPath
    : linkMpb;
}

export function resolveMpbLinkState({
  gearType,
  linkMpb,
  mountIds,
  isMpbSupported,
  market,
  sonyMirrorlessVariant,
  canonMirrorlessVariant,
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
    Boolean(
      getMpbMountSuffix(mountId, {
        sonyMirrorlessVariant,
        canonMirrorlessVariant,
      }),
    ),
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
      directHref = buildMpbOutHref(
        getDirectLensDestinationPath(linkMpb),
        market,
        null,
        sonyMirrorlessVariant,
        canonMirrorlessVariant,
      );
    } else if (hasLegacyMountedLink) {
      directHref = buildMpbOutHref(
        getDirectLensDestinationPath(linkMpb),
        market,
        null,
        sonyMirrorlessVariant,
        canonMirrorlessVariant,
      );
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
