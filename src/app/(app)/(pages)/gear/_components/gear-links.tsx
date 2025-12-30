"use client";

import { track } from "@vercel/analytics";
import Link from "next/link";
import { formatPrice } from "~/lib/mapping";
import { parseAmazonAsin } from "~/lib/validation/amazon";
import { FaAmazon } from "react-icons/fa";
import { SiNikon, SiSony, SiFujifilm, SiLeica } from "react-icons/si";
import MpbLogo from "public/mpb-logo";
import type { ReactNode } from "react";
import { BRANDS } from "~/lib/generated";
import { CanonLogo } from "public/canon-logo";
import { CircleQuestionMark } from "lucide-react";
import { useCountry } from "~/lib/hooks/useCountry";

interface GearLinksProps {
  slug: string;
  linkManufacturer: string | null;
  linkMpb: string | null;
  linkAmazon: string | null;
  linkBh: string | null;
  mpbMaxPriceUsdCents?: number | null;
  brandName: string | null;
  msrpNowUsdCents?: number | null;
}

export function GearLinks({
  slug,
  brandName,
  linkManufacturer,
  linkMpb,
  linkAmazon,
  linkBh,
  mpbMaxPriceUsdCents,
  msrpNowUsdCents,
}: GearLinksProps) {
  const { countryCode } = useCountry();
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
  const brandSlug =
    brandName != null
      ? (BRANDS.find(
          (brand) => brand.name.toLowerCase() === brandName.toLowerCase(),
        )?.slug ?? "")
      : "";
  const manufacturerStyles = getManufacturerStyles(brandSlug);

  if (!hasAny) return null;

  const mpbOutLink = linkMpb
    ? `/api/out/mpb?destinationPath=${encodeURIComponent(linkMpb)}${
        countryCode ? `&market=${encodeURIComponent(countryCode)}` : ""
      }`
    : undefined;

  return (
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
          href={mpbOutLink ?? linkMpb}
          title="See on MPB"
          description={mpbPriceDescription}
          backgroundClass="bg-[#0b002b] hover:bg-[#0b002b]/80"
          textColorClass="text-white"
          logo={<MpbLogo className="h-8 w-8 text-[#ff18bd]" />}
          onClick={() =>
            void track("gear_link_click", {
              slug,
              linkType: "mpb",
            })
          }
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
  );
}

export default GearLinks;

interface AffiliateLinkCardProps {
  href: string;
  title: string;
  description: string;
  backgroundClass: string;
  textColorClass?: string;
  logo: ReactNode;
  onClick?: () => void;
}

function AffiliateLinkCard({
  href,
  title,
  description,
  backgroundClass,
  textColorClass = "text-white",
  logo,
  onClick,
}: AffiliateLinkCardProps) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={`flex w-full items-center justify-between rounded px-6 py-2 transition-all ${backgroundClass} ${textColorClass}`}
      onClick={onClick}
    >
      <div className="flex flex-1 flex-col text-left">
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-xs opacity-90">{description}</span>
      </div>
      <span className="flex items-center justify-center">{logo}</span>
    </Link>
  );
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
