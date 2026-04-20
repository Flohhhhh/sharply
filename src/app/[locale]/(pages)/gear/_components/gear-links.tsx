"use client";

import { track } from "@vercel/analytics";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { FaAmazon } from "react-icons/fa";
import { SiFujifilm, SiLeica, SiNikon, SiSony } from "react-icons/si";
import { CircleQuestionMark } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { useCountry } from "~/lib/hooks/useCountry";
import {
  getMpbMountSuffix,
  hasKnownMpbMountSuffix,
  isMpbSearchInput,
} from "~/lib/links/mpb";
import { getMountLongNameById } from "~/lib/mapping/mounts-map";
import { formatPrice } from "~/lib/mapping";
import { parseAmazonAsin } from "~/lib/validation/amazon";
import { BRANDS } from "~/lib/generated";
import type { GearType } from "~/types/gear";
import { CanonLogo } from "public/canon-logo";
import MpbLogo from "public/mpb-logo";

interface GearLinksProps {
  slug: string;
  gearType: GearType;
  mountIds?: string[] | null;
  linkManufacturer: string | null;
  linkMpb: string | null;
  linkAmazon: string | null;
  linkBh: string | null;
  mpbMaxPriceUsdCents?: number | null;
  brandName: string | null;
  msrpNowUsdCents?: number | null;
}

type MpbMountOption = {
  id: string;
  label: string;
  supported: boolean;
};

export function GearLinks({
  slug,
  gearType,
  mountIds,
  brandName,
  linkManufacturer,
  linkMpb,
  linkAmazon,
  linkBh,
  mpbMaxPriceUsdCents,
  msrpNowUsdCents,
}: GearLinksProps) {
  const { locale } = useCountry();
  const [isMpbDialogOpen, setIsMpbDialogOpen] = useState(false);

  const amazonAsin = parseAmazonAsin(linkAmazon) ?? null;
  const amazonRedirectHref = amazonAsin
    ? `/api/out/amazon?asin=${encodeURIComponent(
        amazonAsin,
      )}&slug=${encodeURIComponent(slug)}`
    : null;
  const bhRedirectHref = linkBh
    ? `/api/out/bh?url=${encodeURIComponent(
        linkBh,
      )}&slug=${encodeURIComponent(slug)}`
    : null;
  const hasAny = !!(
    linkManufacturer ||
    linkMpb ||
    amazonAsin ||
    bhRedirectHref
  );
  const bhPriceDescription =
    msrpNowUsdCents != null
      ? `Around ${formatPrice(truncateToWholeDollars(msrpNowUsdCents), {
          style: "short",
        })} • New and Used`
      : "New and Used";
  const mpbPriceDescription =
    mpbMaxPriceUsdCents != null
      ? `From ${formatPrice(truncateToWholeDollars(mpbMaxPriceUsdCents), {
          style: "short",
        })} • Used`
      : "Used";

  const amazonPriceDescription =
    msrpNowUsdCents != null
      ? `Around ${formatPrice(truncateToWholeDollars(msrpNowUsdCents), {
          style: "short",
        })} • New`
      : "New";
  const normalizedBrandName =
    typeof brandName === "string" ? brandName.trim() : "";
  const brandSlug = normalizedBrandName
    ? (BRANDS.find(
        (brand) =>
          brand.name.toLowerCase() === normalizedBrandName.toLowerCase(),
      )?.slug ?? "")
    : "";
  const manufacturerStyles = getManufacturerStyles(brandSlug);

  const mpbMarket = locale.affiliate.mpbMarket;
  const isLegacyMpbSearchLink = isMpbSearchInput(linkMpb);
  const uniqueMountIds = useMemo(
    () => Array.from(new Set((mountIds ?? []).filter(Boolean))),
    [mountIds],
  );
  const mpbMountOptions = useMemo<MpbMountOption[]>(
    () =>
      uniqueMountIds.map((mountId) => ({
        id: mountId,
        label: getMountLongNameById(mountId),
        supported: Boolean(getMpbMountSuffix(mountId)),
      })),
    [uniqueMountIds],
  );
  const supportedMpbMounts = mpbMountOptions.filter((mount) => mount.supported);
  const hasLegacyMountedLink = hasKnownMpbMountSuffix(linkMpb);
  const shouldShowMpbChooser =
    !isLegacyMpbSearchLink &&
    gearType === "LENS" &&
    mpbMountOptions.length > 1 &&
    supportedMpbMounts.length > 1;
  const directMpbMountId =
    gearType === "LENS" ? (supportedMpbMounts[0]?.id ?? null) : null;
  const directMpbHref = useMemo(() => {
    if (!linkMpb) return undefined;
    if (shouldShowMpbChooser) return undefined;

    if (isLegacyMpbSearchLink) {
      return buildMpbOutHref(linkMpb, mpbMarket, null);
    }

    if (gearType !== "LENS") {
      return buildMpbOutHref(linkMpb, mpbMarket, null);
    }

    if (supportedMpbMounts.length === 1 && directMpbMountId) {
      return buildMpbOutHref(linkMpb, mpbMarket, directMpbMountId);
    }

    if (hasLegacyMountedLink) {
      return buildMpbOutHref(linkMpb, mpbMarket, null);
    }

    return undefined;
  }, [
    directMpbMountId,
    gearType,
    hasLegacyMountedLink,
    isLegacyMpbSearchLink,
    linkMpb,
    mpbMarket,
    shouldShowMpbChooser,
    supportedMpbMounts.length,
  ]);
  const isMpbUnavailable =
    Boolean(linkMpb) && !shouldShowMpbChooser && !directMpbHref;

  if (!hasAny) return null;

  function handleMpbMountSelection(mountId: string) {
    if (!linkMpb) return;
    const href = buildMpbOutHref(linkMpb, mpbMarket, mountId);
    if (!href) return;

    void track("gear_link_click", {
      slug,
      linkType: "mpb",
      mountId,
    });

    window.open(href, "_blank", "noopener,noreferrer");
    setIsMpbDialogOpen(false);
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Links</h2>
        </div>

        {linkManufacturer && (
          <AffiliateLinkCard
            href={linkManufacturer}
            title={manufacturerStyles.title}
            description="Official site"
            backgroundClass={manufacturerStyles.backgroundClass}
            textColorClass={manufacturerStyles.textColorClass}
            logo={manufacturerStyles.logo}
            onClick={() =>
              void track("gear_link_click", {
                slug,
                linkType: "manufacturer",
              })
            }
          />
        )}
        {linkMpb && (
          <AffiliateLinkCard
            href={directMpbHref}
            title="See on MPB"
            description={
              isMpbUnavailable
                ? "Used • Mount-specific MPB link unavailable"
                : mpbPriceDescription
            }
            backgroundClass="bg-[#0b002b] hover:bg-[#0b002b]/80"
            textColorClass="text-white"
            logo={<MpbLogo className="h-8 w-8 text-[#ff18bd]" />}
            disabled={isMpbUnavailable}
            onClick={() => {
              if (shouldShowMpbChooser) {
                setIsMpbDialogOpen(true);
                return;
              }

              void track("gear_link_click", {
                slug,
                linkType: "mpb",
                mountId: directMpbMountId,
              });
            }}
          />
        )}
        {amazonAsin && amazonRedirectHref && (
          <AffiliateLinkCard
            href={amazonRedirectHref}
            title="Buy on Amazon"
            description={amazonPriceDescription}
            backgroundClass="bg-[#ffd814] hover:bg-[#ffd814]/70"
            textColorClass="text-black"
            logo={<FaAmazon className="h-8 w-8" />}
            onClick={() =>
              void track("gear_link_click", {
                slug,
                linkType: "amazon",
              })
            }
          />
        )}
        {bhRedirectHref && (
          <AffiliateLinkCard
            href={bhRedirectHref}
            title="Buy at B&H Photo"
            description={bhPriceDescription}
            backgroundClass="bg-[#b03734] hover:bg-[#b03734]/80"
            textColorClass="text-white"
            logo={<></>}
            onClick={() =>
              void track("gear_link_click", {
                slug,
                linkType: "bhphoto",
              })
            }
          />
        )}
      </div>

      <Dialog open={isMpbDialogOpen} onOpenChange={setIsMpbDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose MPB Mount</DialogTitle>
            <DialogDescription>
              This item has multiple MPB mount listings. Pick the mount you want
              to open.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {mpbMountOptions.map((mount) => (
              <Button
                key={mount.id}
                type="button"
                variant="outline"
                className="w-full justify-start"
                disabled={!mount.supported}
                onClick={() => handleMpbMountSelection(mount.id)}
              >
                {mount.label}
                {!mount.supported ? " (Unavailable)" : ""}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default GearLinks;

interface AffiliateLinkCardProps {
  href?: string;
  title: string;
  description: string;
  backgroundClass: string;
  textColorClass?: string;
  logo: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}

function AffiliateLinkCard({
  href,
  title,
  description,
  backgroundClass,
  textColorClass = "text-white",
  logo,
  disabled = false,
  onClick,
}: AffiliateLinkCardProps) {
  const className = `flex w-full items-center justify-between rounded px-6 py-2 transition-all ${backgroundClass} ${textColorClass} ${
    disabled ? "cursor-not-allowed opacity-60" : ""
  }`;

  if (href && !disabled) {
    return (
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className={className}
        onClick={onClick}
      >
        <AffiliateLinkCardContent
          title={title}
          description={description}
          logo={logo}
        />
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      <AffiliateLinkCardContent
        title={title}
        description={description}
        logo={logo}
      />
    </button>
  );
}

function AffiliateLinkCardContent({
  title,
  description,
  logo,
}: Pick<AffiliateLinkCardProps, "title" | "description" | "logo">) {
  return (
    <>
      <div className="flex flex-1 flex-col text-left">
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-xs opacity-90">{description}</span>
      </div>
      <span className="flex items-center justify-center">{logo}</span>
    </>
  );
}

function buildMpbOutHref(
  linkMpb: string,
  market: string | null,
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

function getManufacturerStyles(brandSlug: string): {
  title: string;
  backgroundClass: string;
  textColorClass: string;
  logo: ReactNode;
} {
  switch (brandSlug) {
    case "nikon":
      return {
        title: "Visit Nikon",
        backgroundClass: "bg-accent hover:bg-accent/70",
        textColorClass: "text-primary",
        logo: (
          <div className="flex h-4 w-12 items-center overflow-hidden">
            <SiNikon className="size-96" />
          </div>
        ),
      };
    case "canon":
      return {
        title: "Visit Canon",
        backgroundClass: "bg-accent hover:bg-accent/70",
        textColorClass: "text-primary",
        logo: <CanonLogo className="h-4" />,
      };
    case "sony":
      return {
        title: "Visit Sony",
        backgroundClass: "bg-accent hover:bg-accent/70",
        textColorClass: "text-primary",
        logo: (
          <div className="flex h-4 w-12 items-center overflow-hidden">
            <SiSony className="size-96" />
          </div>
        ),
      };
    case "fujifilm":
      return {
        title: "Visit Fujifilm",
        backgroundClass: "bg-accent hover:bg-accent/70",
        textColorClass: "text-primary",
        logo: (
          <div className="flex h-4 w-16 items-center overflow-hidden">
            <SiFujifilm className="size-96" />
          </div>
        ),
      };
    case "tamron":
      return {
        title: "Visit Tamron",
        backgroundClass: "bg-accent hover:bg-accent/70",
        textColorClass: "text-primary",
        logo: <></>,
      };
    case "sigma":
      return {
        title: "Visit Sigma",
        backgroundClass: "bg-accent hover:bg-accent/70",
        textColorClass: "text-primary",
        logo: <></>,
      };
    case "leica":
      return {
        title: "Visit Leica",
        backgroundClass: "bg-accent hover:bg-accent/70",
        textColorClass: "text-primary",
        logo: <SiLeica className="size-8 text-red-500" />,
      };
    default:
      return {
        title: "Visit manufacturer",
        backgroundClass: "bg-accent hover:bg-accent/70",
        textColorClass: "text-primary",
        logo: <CircleQuestionMark className="h-4 w-4" />,
      };
  }
}

function truncateToWholeDollars(priceCents: number): number {
  if (priceCents >= 0) {
    return Math.floor(priceCents / 100) * 100;
  }
  return Math.ceil(priceCents / 100) * 100;
}
