"use client";

import { Button } from "~/components/ui/button";
import Link from "next/link";
import { formatPrice } from "~/lib/mapping";
import { parseAmazonAsin } from "~/lib/validation/amazon";

interface GearLinksProps {
  slug: string;
  linkManufacturer: string | null;
  linkMpb: string | null;
  linkAmazon: string | null;
  mpbMaxPriceUsdCents?: number | null;
  brandName: string | null;
}

export function GearLinks({
  slug,
  brandName,
  linkManufacturer,
  linkMpb,
  linkAmazon,
  mpbMaxPriceUsdCents,
}: GearLinksProps) {
  const amazonAsin = parseAmazonAsin(linkAmazon) ?? null;
  const amazonRedirectHref = amazonAsin
    ? `/api/out/amazon?asin=${encodeURIComponent(
        amazonAsin,
      )}&slug=${encodeURIComponent(slug)}`
    : null;
  const hasAny = !!(linkManufacturer || linkMpb || amazonAsin);

  if (!hasAny) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Links</h2>
      </div>

      {linkManufacturer && (
        <Button variant="outline" asChild className="w-full">
          <Link
            href={linkManufacturer}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="text-primary font-bold">{brandName}</span>
          </Link>
        </Button>
      )}
      {linkMpb && (
        <Button variant="outline" asChild className="w-full">
          <Link href={linkMpb} target="_blank" rel="noopener noreferrer">
            {typeof mpbMaxPriceUsdCents === "number" ? (
              <>
                <span className="font-bold text-[#FF006B]">MPB</span>
                {" - "}
                {formatPrice(mpbMaxPriceUsdCents)}
              </>
            ) : (
              <>
                <span className="text-muted-foreground">MPB</span> See on MPB
              </>
            )}
          </Link>
        </Button>
      )}
      {amazonAsin && amazonRedirectHref && (
        <Button variant="outline" asChild className="w-full">
          <Link
            href={amazonRedirectHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="font-bold text-[#FF9900]">Amazon</span>
          </Link>
        </Button>
      )}
    </div>
  );
}

export default GearLinks;
